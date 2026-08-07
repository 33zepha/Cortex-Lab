import { useEffect, useState } from "react";
import type { SystemHealth } from "@/lib/types";
import { apiFetch } from "@/lib/api";

/** Santé système réelle depuis l'API Cortex — remplace les fixtures. */
export function useSystemHealth() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<SystemHealth>("/api/health")
      .then((data) => {
        if (!cancelled) setHealth(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { health, loading: health === null && !error, error };
}
