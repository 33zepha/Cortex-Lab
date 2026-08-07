import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";

const SESSION_COOKIE = "cortex_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

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

function extractTargetUrl(req: VercelRequest, upstreamOrigin: string): { targetUrl: string; pathname: string; search: string } {
  const rawUrl = req.url ?? "/";
  const parsedUrl = new URL(rawUrl, "http://localhost");

  let pathname = "";
  if (req.query.path) {
    const rawPath = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;
    const cleanSegments = rawPath.replace(/^\/?(api\/)?/, "");
    pathname = `/api/${cleanSegments}`;
  } else {
    pathname = parsedUrl.pathname;
    if (!pathname.startsWith("/api")) pathname = `/api${pathname.startsWith("/") ? "" : "/"}${pathname}`;
  }

  parsedUrl.searchParams.delete("path");
  const search = parsedUrl.search;
  return { targetUrl: `${upstreamOrigin}${pathname}${search}`, pathname, search };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(cookieHeader.split(";").map((part) => {
    const [name, ...value] = part.trim().split("=");
    return [name, decodeURIComponent(value.join("="))];
  }).filter(([name]) => Boolean(name)));
}

function signSession(username: string, expiresAt: number, secret: string): string {
  const payload = `${username}.${expiresAt}`;
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function hasValidSession(req: VercelRequest, username: string, secret: string): boolean {
  const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [tokenUser, rawExpiresAt, signature] = parts;
  const expiresAt = Number(rawExpiresAt);
  if (tokenUser !== username || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) return false;
  const expected = signSession(tokenUser, expiresAt, secret).split(".").at(-1) ?? "";
  return safeEqual(signature, expected);
}

function setSessionCookie(res: VercelResponse, value: string, maxAge: number): void {
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`,
  );
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

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startTime = Date.now();
  const upstreamOrigin = process.env.CORTEX_API_ORIGIN?.replace(/\/$/, "");
  const apiToken = process.env.CORTEX_API_TOKEN?.trim();
  const accessUser = process.env.CORTEX_ACCESS_USER?.trim() || "boss";
  const accessPassword = process.env.CORTEX_ACCESS_PASSWORD?.trim() || apiToken;
  const sessionSecret = process.env.CORTEX_SESSION_SECRET?.trim() || apiToken || accessPassword;
  const method = (req.method ?? "GET").toUpperCase();
  const requestedPath = extractTargetUrl(req, upstreamOrigin || "http://invalid.local").pathname;

  if (requestedPath === "/api/auth/login") {
    if (method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }
    if (!accessPassword || !sessionSecret) {
      res.status(503).json({ error: "Cortex access is not configured" });
      return;
    }
    const body = (req.body && typeof req.body === "object" ? req.body : {}) as { username?: unknown; password?: unknown };
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!safeEqual(username, accessUser) || !safeEqual(password, accessPassword)) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    setSessionCookie(res, signSession(accessUser, expiresAt, sessionSecret), SESSION_TTL_SECONDS);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: true, user: accessUser });
    return;
  }

  if (requestedPath === "/api/auth/session") {
    if (!accessPassword || !sessionSecret || !hasValidSession(req, accessUser, sessionSecret)) {
      res.setHeader("Cache-Control", "no-store");
      res.status(401).json({ authenticated: false });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: true, user: accessUser });
    return;
  }

  if (requestedPath === "/api/auth/logout") {
    setSessionCookie(res, "", 0);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ authenticated: false });
    return;
  }

  if (!accessPassword || !sessionSecret || !hasValidSession(req, accessUser, sessionSecret)) {
    res.setHeader("Cache-Control", "no-store");
    res.status(401).json({ error: "Cortex session required" });
    return;
  }

  if (!upstreamOrigin) {
    console.error(JSON.stringify({ event: "proxy_config_error", error: "CORTEX_API_ORIGIN manquant côté Vercel", timestamp: new Date().toISOString() }));
    res.status(503).json({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
    return;
  }

  try {
    new URL(upstreamOrigin);
  } catch {
    console.error(JSON.stringify({ event: "proxy_config_error", error: "CORTEX_API_ORIGIN invalide", timestamp: new Date().toISOString() }));
    res.status(503).json({ error: "CORTEX_API_ORIGIN invalide" });
    return;
  }

  const { targetUrl, pathname, search } = extractTargetUrl(req, upstreamOrigin);
  console.log(JSON.stringify({ event: "proxy_request", method, path: pathname, search, timestamp: new Date().toISOString() }));

  const forwardHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey === "host" || lowerKey === "authorization" || lowerKey === "cookie") continue;
    forwardHeaders[key] = Array.isArray(value) ? value.join(", ") : value;
  }

  if (apiToken) forwardHeaders.authorization = `Bearer ${apiToken}`;
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
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding" || lower === "content-length" || lower === "set-cookie") return;
      res.setHeader(key, value);
    });

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
