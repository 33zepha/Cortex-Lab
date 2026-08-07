const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

// En local, le frontend parle directement à Fastify. En production/preview,
// on reste same-origin : /api est relayé côté Vercel vers l'API Cortex centrale.
const API_BASE_URL = configuredApiBase ?? (import.meta.env.DEV ? "http://localhost:4000" : "");

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    throw new Error(payload?.error ?? `API ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}
