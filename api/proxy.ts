import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";

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

async function fetchUpstream(
  targetUrl: string,
  init: RequestInit,
  method: string,
): Promise<Response> {
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
  const method = (req.method ?? "GET").toUpperCase();

  if (!upstreamOrigin) {
    console.error(JSON.stringify({
      event: "proxy_config_error",
      error: "CORTEX_API_ORIGIN manquant côté Vercel",
      timestamp: new Date().toISOString(),
    }));
    res.status(503).json({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
    return;
  }

  try {
    new URL(upstreamOrigin);
  } catch {
    console.error(JSON.stringify({
      event: "proxy_config_error",
      error: "CORTEX_API_ORIGIN invalide",
      timestamp: new Date().toISOString(),
    }));
    res.status(503).json({ error: "CORTEX_API_ORIGIN invalide" });
    return;
  }

  const { targetUrl, pathname, search } = extractTargetUrl(req, upstreamOrigin);
  console.log(JSON.stringify({
    event: "proxy_request",
    method,
    path: pathname,
    search,
    timestamp: new Date().toISOString(),
  }));

  const forwardHeaders: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey === "host" || lowerKey === "authorization") continue;
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

    console.log(JSON.stringify({
      event: "proxy_response",
      method,
      path: pathname,
      status: upstreamResponse.status,
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }));

    res.status(upstreamResponse.status);
    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding" || lower === "content-length") return;
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
    console.error(JSON.stringify({
      event: "proxy_error",
      method,
      path: pathname,
      error: error instanceof Error ? error.message : String(error),
      durationMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }));

    if (!res.headersSent) res.status(502).json({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
  }
}
