import type { VercelRequest, VercelResponse } from "@vercel/node";
import { timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { MemoryRateLimiter } from "../backend/core/security/rate-limit.js";
import {
  buildSessionCookie,
  createSessionToken,
  getSessionSubject,
  isAcceptableSessionSecret,
  parseCookies,
  SESSION_COOKIE,
  resolveSessionSecret,
  SESSION_TTL_SECONDS,
} from "../backend/core/auth/session.js";

const authRateLimiter = new MemoryRateLimiter({ maxAttempts: 12, windowMs: 60_000 });

async function getRawBody(req: VercelRequest): Promise<Buffer | undefined> {
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") return undefined;
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  if (req.body && typeof req.body === "object") return Buffer.from(JSON.stringify(req.body));

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return chunks.length > 0 ? Buffer.concat(chunks) : undefined;
}

function extractTargetUrl(req: VercelRequest, upstreamOrigin: string): { targetUrl: string; pathname: string; search: string; invalid: boolean } {
  const rawUrl = req.url ?? "/";
  const parsedUrl = new URL(rawUrl, "http://localhost");

  let pathname = "";
  if (req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    const cleanPath = rawPath.replace(/^\/?(?:api\/)?/, "");
    const segments = cleanPath.split("/").filter(Boolean);
    if (!cleanPath || segments.some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) {
      return { targetUrl: "", pathname: "", search: "", invalid: true };
    }
    pathname = `/api/${segments.map((segment) => encodeURIComponent(segment)).join("/")}`;
  } else {
    pathname = parsedUrl.pathname;
    if (!pathname.startsWith("/api")) pathname = `/api${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  }

  parsedUrl.searchParams.delete("path");
  const search = parsedUrl.search;
  return { targetUrl: `${upstreamOrigin}${pathname}${search}`, pathname, search, invalid: false };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function sessionSubject(req: VercelRequest, secret: string): string | null {
  return getSessionSubject(req.headers.cookie, secret);
}

function clientAddress(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return value?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
}

function setSessionCookie(res: VercelResponse, subject: string, secret: string): void {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  res.setHeader("Set-Cookie", buildSessionCookie(createSessionToken(subject, expiresAt, secret), SESSION_TTL_SECONDS, true));
}

function clearSessionCookie(res: VercelResponse): void {
  res.setHeader("Set-Cookie", buildSessionCookie("", 0, true));
}

function sessionCookieHeader(cookieHeader: string | undefined): string | undefined {
  const token = parseCookies(cookieHeader)[SESSION_COOKIE];
  return token ? `${SESSION_COOKIE}=${encodeURIComponent(token)}` : undefined;
}

function resolveUpstreamOrigin(): string | null {
  const raw = process.env.CORTEX_API_ORIGIN?.trim().replace(/\/$/, "");
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (!(["http:", "https:"] as string[]).includes(parsed.protocol) || parsed.username || parsed.password) return null;
    return raw;
  } catch {
    return null;
  }
}

async function fetchUpstream(targetUrl: string, init: RequestInit, method: string): Promise<Response> {
  const safeToRetry = method === "GET" || method === "HEAD";
  const attempts = safeToRetry ? 2 : 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetch(targetUrl, init);
    } catch (error) {
      lastError = error;
      if (attempt >= attempts) break;
      await sleep(250);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function copyResponseHeaders(upstream: Response, res: VercelResponse): void {
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "transfer-encoding" || lower === "content-length" || lower === "set-cookie") return;
    res.setHeader(key, value);
  });
}

async function proxyAuthRequest(
  req: VercelRequest,
  res: VercelResponse,
  upstreamOrigin: string,
  apiToken: string | undefined,
  sessionSecret: string,
  method: string,
  requestedPath: string,
): Promise<void> {
  const { targetUrl } = extractTargetUrl(req, upstreamOrigin);
  const body = await getRawBody(req);
  const forwardHeaders: Record<string, string> = { "content-type": "application/json" };
  if (apiToken) forwardHeaders.authorization = `Bearer ${apiToken}`;

  const upstreamResponse = await fetchUpstream(targetUrl, {
    method,
    headers: forwardHeaders,
    body: body ? (new Uint8Array(body.buffer, body.byteOffset, body.byteLength) as unknown as BodyInit) : undefined,
    redirect: "manual",
  }, method);

  const responseText = await upstreamResponse.text();
  let payload: { user?: unknown } = {};
  try {
    payload = JSON.parse(responseText) as { user?: unknown };
  } catch {
    // Keep the upstream response body intact for diagnostics.
  }

  if (upstreamResponse.ok && typeof payload.user === "string" && payload.user.trim()) {
    setSessionCookie(res, payload.user.trim(), sessionSecret);
  }

  copyResponseHeaders(upstreamResponse, res);
  res.setHeader("Cache-Control", "no-store");
  res.status(upstreamResponse.status);
  res.end(responseText);
  console.log(JSON.stringify({ event: "proxy_auth_response", method, path: requestedPath, status: upstreamResponse.status }));
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startTime = Date.now();
  const upstreamOrigin = resolveUpstreamOrigin();
  const apiToken = process.env.CORTEX_API_TOKEN?.trim();
  const accessUser = process.env.CORTEX_ACCESS_USER?.trim() || "boss";
  const accessPassword = process.env.CORTEX_ACCESS_PASSWORD?.trim() || "";
  const productionRuntime = process.env.NODE_ENV === "production" || process.env.CORTEX_ENV === "production";
  const sessionSecret = resolveSessionSecret(process.env.CORTEX_SESSION_SECRET, productionRuntime);
  const sessionSecretReady = isAcceptableSessionSecret(sessionSecret, productionRuntime);
  const method = (req.method ?? "GET").toUpperCase();
  const extractedRequest = extractTargetUrl(req, upstreamOrigin || "http://invalid.local");
  const requestedPath = extractedRequest.pathname;

  if (extractedRequest.invalid) {
    res.status(400).json({ error: "Invalid API path" });
    return;
  }

  if (requestedPath !== "/api/auth/logout" && !sessionSecretReady) {
    res.setHeader("Cache-Control", "no-store");
    res.status(503).json({ error: "CORTEX_SESSION_SECRET is not configured correctly" });
    return;
  }

  if (requestedPath === "/api/auth/login" || requestedPath === "/api/auth/signup") {
    if (method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const rateLimit = authRateLimiter.consume(`${requestedPath}:${clientAddress(req)}`);
    if (!rateLimit.allowed) {
      res.setHeader("Retry-After", String(rateLimit.retryAfterSeconds));
      res.setHeader("Cache-Control", "no-store");
      res.status(429).json({ error: "Too many authentication attempts" });
      return;
    }

    const body = (req.body && typeof req.body === "object" ? req.body : {}) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (
      requestedPath === "/api/auth/login" &&
      accessPassword &&
      safeEqual(username, accessUser) &&
      safeEqual(password, accessPassword) &&
      sessionSecret
    ) {
      setSessionCookie(res, accessUser, sessionSecret);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ authenticated: true, user: accessUser });
      return;
    }

    if (requestedPath === "/api/auth/signup") {
      if (!upstreamOrigin || !sessionSecret) {
        res.status(503).json({ error: "Account creation requires a configured Cortex API" });
        return;
      }
      try {
        await proxyAuthRequest(req, res, upstreamOrigin, apiToken, sessionSecret, method, requestedPath);
      } catch (error) {
        console.error(JSON.stringify({ event: "proxy_auth_error", method, path: requestedPath, error: error instanceof Error ? error.message : String(error) }));
        if (!res.headersSent) res.status(502).json({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
      }
      return;
    }

    if (upstreamOrigin && sessionSecret) {
      try {
        await proxyAuthRequest(req, res, upstreamOrigin, apiToken, sessionSecret, method, requestedPath);
      } catch (error) {
        console.error(JSON.stringify({ event: "proxy_auth_error", method, path: requestedPath, error: error instanceof Error ? error.message : String(error) }));
        if (!res.headersSent) res.status(502).json({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
      }
      return;
    }

    if (!accessPassword || !sessionSecret) {
      res.status(503).json({ error: "Cortex access is not configured" });
      return;
    }

    if (!safeEqual(username, accessUser) || !safeEqual(password, accessPassword)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    setSessionCookie(res, accessUser, sessionSecret);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: true, user: accessUser });
    return;
  }

  if (requestedPath === "/api/auth/session") {
    const subject = sessionSecret ? sessionSubject(req, sessionSecret) : null;
    const validForLegacyMode = Boolean(upstreamOrigin) || (subject && safeEqual(subject, accessUser));
    if (!subject || !validForLegacyMode) {
      res.setHeader("Cache-Control", "no-store");
      res.status(401).json({ authenticated: false });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: true, user: subject });
    return;
  }

  if (requestedPath === "/api/auth/logout") {
    clearSessionCookie(res);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: false });
    return;
  }

  const subject = sessionSecret ? sessionSubject(req, sessionSecret) : null;
  const validForLegacyMode = Boolean(upstreamOrigin) || (subject && safeEqual(subject, accessUser));
  if (!subject || !validForLegacyMode) {
    res.setHeader("Cache-Control", "no-store");
    res.status(401).json({ error: "Cortex session required" });
    return;
  }

  if (!upstreamOrigin) {
    console.error(JSON.stringify({ event: "proxy_config_error", error: "CORTEX_API_ORIGIN manquant côté Vercel", timestamp: new Date().toISOString() }));
    res.status(503).json({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
    return;
  }

  const { targetUrl, pathname, search } = extractTargetUrl(req, upstreamOrigin);
  console.log(JSON.stringify({ event: "proxy_request", method, path: pathname, search, timestamp: new Date().toISOString() }));

  const forwardHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey === "host" || lowerKey === "authorization" || lowerKey === "cookie" || lowerKey === "x-cortex-user") continue;
    forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  if (apiToken) forwardHeaders.authorization = `Bearer ${apiToken}`;
  const forwardedSessionCookie = sessionCookieHeader(req.headers.cookie);
  if (forwardedSessionCookie) forwardHeaders.cookie = forwardedSessionCookie;
  forwardHeaders["ngrok-skip-browser-warning"] = "true";

  try {
    const body = await getRawBody(req);
    const upstreamResponse = await fetchUpstream(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body ? (new Uint8Array(body.buffer, body.byteOffset, body.byteLength) as unknown as BodyInit) : undefined,
      redirect: "manual",
    }, method);

    console.log(JSON.stringify({ event: "proxy_response", method, path: pathname, status: upstreamResponse.status, durationMs: Date.now() - startTime, timestamp: new Date().toISOString() }));

    res.status(upstreamResponse.status);
    copyResponseHeaders(upstreamResponse, res);

    if (!upstreamResponse.body) {
      res.end();
      return;
    }

    if (typeof (res as any).on === "function" && typeof Readable.fromWeb === "function") {
      const nodeStream = Readable.fromWeb(upstreamResponse.body as any);
      nodeStream.pipe(res);
      return;
    }

    const reader = upstreamResponse.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } finally {
      res.end();
    }
  } catch (error) {
    console.error(JSON.stringify({ event: "proxy_error", method, path: pathname, error: error instanceof Error ? error.message : String(error), durationMs: Date.now() - startTime, timestamp: new Date().toISOString() }));
    if (!res.headersSent) res.status(502).json({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
  }
}
