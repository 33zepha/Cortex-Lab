const UPSTREAM_ORIGIN = process.env.CORTEX_API_ORIGIN?.replace(/\/$/, "");
const API_TOKEN = process.env.CORTEX_API_TOKEN?.trim();

function configError(message: string) {
  return Response.json({ error: message }, { status: 503 });
}

async function proxy(request: Request): Promise<Response> {
  if (!UPSTREAM_ORIGIN) {
    return configError("CORTEX_API_ORIGIN manquant côté Vercel");
  }
  if (!API_TOKEN) {
    return configError("CORTEX_API_TOKEN manquant côté Vercel");
  }

  let upstreamBase: URL;
  try {
    upstreamBase = new URL(UPSTREAM_ORIGIN);
  } catch {
    return configError("CORTEX_API_ORIGIN invalide");
  }

  if (process.env.VERCEL && upstreamBase.protocol !== "https:") {
    return configError("CORTEX_API_ORIGIN doit utiliser HTTPS en déploiement Vercel");
  }

  const incoming = new URL(request.url);
  const upstreamUrl = new URL(
    `${incoming.pathname}${incoming.search}`,
    `${upstreamBase.toString().replace(/\/$/, "")}/`,
  );

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${API_TOKEN}`);
  headers.set("Accept", request.headers.get("accept") ?? "application/json");
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  const timeoutMs = method === "GET" || method === "HEAD" ? 8_000 : 280_000;

  try {
    const upstream = await fetch(upstreamUrl, {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstream.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("Content-Type", upstreamContentType);
    responseHeaders.set("Cache-Control", "no-store");

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Cortex API proxy failed", error);
    return Response.json({ error: "API Cortex centrale inaccessible" }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
