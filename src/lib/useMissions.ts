import { useCallback } from "react";
import useSWR from "swr";
import type { Mission } from "@/lib/types";
import { apiFetch, shouldRetryOnError } from "@/lib/api";
import { useCortexStream } from "@/lib/useCortexStream";

/** Source canonique = API ; SSE invalide immédiatement, le polling reste un filet de sécurité. */
export function useMissions() {
  const { data, error, isLoading, mutate } = useSWR<Mission[]>(
    "/api/missions",
    apiFetch,
    { refreshInterval: 15_000, revalidateOnFocus: true, shouldRetryOnError },
  );

  const onEvent = useCallback(() => {
    void mutate();
  }, [mutate]);
  useCortexStream(onEvent);

  return {
    missions: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: mutate,
  };
}

export function useMission(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Mission>(
    id ? `/api/missions/${id}` : null,
    apiFetch,
    { refreshInterval: 15_000, revalidateOnFocus: true, shouldRetryOnError },
  );

  const onEvent = useCallback((event: { missionId: string }) => {
    if (event.missionId === id) void mutate();
  }, [id, mutate]);
  useCortexStream(onEvent);

  return {
    mission: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: mutate,
  };
}
