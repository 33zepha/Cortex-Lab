/// <reference types="vite/client" />
import {
  isOperatorSimulatorEnabled,
  simulatorFetch,
  simulatorPost,
} from "@/lib/operator-simulator";

const configuredApiBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
const API_BASE_URL = configuredApiBase ?? "";

export function apiUrl(path: string) {
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

export function shouldRetryOnError(error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
  return true;
}

export async function apiFetch<T>(path: string): Promise<T> {
  if (isOperatorSimulatorEnabled()) return simulatorFetch<T>(path);

  const res = await fetch(apiUrl(path), {
    cache: "no-store",
    credentials: "include",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.error ?? `API ${path} → ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  if (isOperatorSimulatorEnabled()) return simulatorPost<T>(path, body);

  const res = await fetch(apiUrl(path), {
    method: "POST",
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.error ?? `API ${path} → ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return res.json() as Promise<T>;
}
