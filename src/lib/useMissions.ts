import useSWR from "swr";
import type { Mission } from "@/lib/types";
import { apiFetch, shouldRetryOnError } from "@/lib/api";

/** Missions réelles depuis l'API Cortex avec polling SWR pour synchronisation temps réel inter-appareils. */
export function useMissions() {
  const { data, error, isLoading, mutate } = useSWR<Mission[]>(
    "/api/missions",
    apiFetch,
    { refreshInterval: 5000, revalidateOnFocus: true, shouldRetryOnError }
  );

  return {
    missions: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: mutate
  };
}

export function useMission(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Mission>(
    id ? `/api/missions/${id}` : null,
    apiFetch,
    { refreshInterval: 3000, revalidateOnFocus: true, shouldRetryOnError }
  );

  return {
    mission: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: mutate,
  };
}
