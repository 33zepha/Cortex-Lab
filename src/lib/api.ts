/// <reference types="vite/client" />
const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");

// En local, le frontend parle directement à Fastify via l'IP actuelle (permet l'accès mobile sur le même WiFi).
// En production/preview, on reste same-origin : /api est relayé vers l'API Cortex centrale par le proxy Vercel server-side.
const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
const API_BASE_URL = configuredApiBase ?? (import.meta.env.DEV ? `http://${hostname}:4000` : "");

function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Règle de retry SWR : ne retrie PAS les erreurs déterministes 4xx (400, 401, 403, 404).
 * Conserve les retries pour les erreurs réseau et 5xx temporaires.
 */
export function shouldRetryOnError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status >= 400 && error.status < 500) {
      return false;
    }
  }
  return true;
}

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(apiUrl(path), { cache: "no-store" });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.error ?? `API ${path} → ${res.status}`;
    throw new ApiError(message, res.status);
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
    const message = payload?.error ?? `API ${path} → ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
