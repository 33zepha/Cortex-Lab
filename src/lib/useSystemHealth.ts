import useSWR from "swr";
import type { SystemHealth } from "@/lib/types";
import { apiFetch, shouldRetryOnError } from "@/lib/api";

/** Santé système réelle depuis l'API Cortex avec polling SWR. */
export function useSystemHealth() {
  const { data, error, isLoading } = useSWR<SystemHealth>(
    "/api/health",
    apiFetch,
    { refreshInterval: 5000, revalidateOnFocus: true, shouldRetryOnError }
  );

  return { 
    health: data ?? null, 
    loading: isLoading, 
    error: error instanceof Error ? error.message : error ? String(error) : null 
  };
}
