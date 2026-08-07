import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Readable } from "node:stream";

async function getRawBody(req: VercelRequest): Promise<Buffer | undefined> {
  const method = (req.method ?? "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  if (Buffer.isBuffer(req.body)) {
    return req.body;
  }

  if (typeof req.body === "string") {
    return Buffer.from(req.body);
  }

  if (req.body && typeof req.body === "object") {
    return Buffer.from(JSON.stringify(req.body));
  }

  const chunks: Uint8Array[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  if (chunks.length === 0) return undefined;
  return Buffer.concat(chunks);
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
    if (!pathname.startsWith("/api")) {
      pathname = `/api${pathname.startsWith("/") ? "" : "/"}${pathname}`;
    }
  }

  // Nettoie le paramètre de query "path" injecté par la rewrite Vercel /api/:path*
  parsedUrl.searchParams.delete("path");

  const search = parsedUrl.search;
  const targetUrl = `${upstreamOrigin}${pathname}${search}`;
  return { targetUrl, pathname, search };
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const startTime = Date.now();
  const upstreamOrigin = process.env.CORTEX_API_ORIGIN?.replace(/\/$/, "");
  const apiToken = process.env.CORTEX_API_TOKEN?.trim();

  if (!upstreamOrigin) {
    console.error(
      JSON.stringify({
        event: "proxy_config_error",
        error: "CORTEX_API_ORIGIN manquant côté Vercel",
        timestamp: new Date().toISOString(),
      }),
    );
    res.status(503).json({ error: "CORTEX_API_ORIGIN manquant côté Vercel" });
    return;
  }

  try {
    new URL(upstreamOrigin);
  } catch {
    console.error(
      JSON.stringify({
        event: "proxy_config_error",
        error: "CORTEX_API_ORIGIN invalide",
        origin: upstreamOrigin,
        timestamp: new Date().toISOString(),
      }),
    );
    res.status(503).json({ error: "CORTEX_API_ORIGIN invalide" });
    return;
  }

  const { targetUrl, pathname, search } = extractTargetUrl(req, upstreamOrigin);

  console.log(
    JSON.stringify({
      event: "proxy_request",
      method: req.method,
      path: pathname,
      search,
      targetUrl,
      timestamp: new Date().toISOString(),
    }),
  );

  const forwardHeaders: Record<string, string> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey === "host") continue;

    if (Array.isArray(value)) {
      forwardHeaders[key] = value.join(", ");
    } else {
      forwardHeaders[key] = value;
    }
  }

  // Seul le serveur Proxy Vercel injecte le jeton secret CORTEX_API_TOKEN
  if (apiToken) {
    forwardHeaders["authorization"] = `Bearer ${apiToken}`;
  }

  forwardHeaders["ngrok-skip-browser-warning"] = "true";

  try {
    const body = await getRawBody(req);
    const upstreamResponse = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body ? (new Uint8Array(body.buffer, body.byteOffset, body.byteLength) as unknown as BodyInit) : undefined,
      redirect: "manual",
    });

    console.log(
      JSON.stringify({
        event: "proxy_response",
        method: req.method,
        path: pathname,
        status: upstreamResponse.status,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }),
    );

    res.status(upstreamResponse.status);

    upstreamResponse.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower === "transfer-encoding" || lower === "content-length") return;
      res.setHeader(key, value);
    });

    if (upstreamResponse.body) {
      if (typeof (res as any).on === "function" && typeof Readable.fromWeb === "function") {
        const nodeStream = Readable.fromWeb(upstreamResponse.body as any);
        nodeStream.pipe(res);
      } else {
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
      }
    } else {
      res.end();
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "proxy_error",
        method: req.method,
        path: pathname,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }),
    );

    if (!res.headersSent) {
      res.status(502).json({ error: "API Cortex centrale inaccessible (502 Bad Gateway)" });
    }
  }
}
