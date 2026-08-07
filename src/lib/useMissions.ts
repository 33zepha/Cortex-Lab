import { useCallback, useEffect, useState } from "react";
import type { Mission } from "@/lib/types";
import { apiFetch } from "@/lib/api";

/** Missions réelles depuis l'API Cortex (packages/api). Même forme que les fixtures — aucun changement d'UI requis. */
export function useMissions() {
  const [missions, setMissions] = useState<Mission[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiFetch<Mission[]>("/api/missions")
      .then((data) => {
        if (!cancelled) setMissions(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { missions, loading: missions === null && !error, error, refetch };
}

export function useMission(id: string | undefined) {
  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiFetch<Mission>(`/api/missions/${id}`)
      .then((data) => {
        if (!cancelled) {
          setMission(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { mission, loading, error };
}
