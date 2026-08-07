import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { TokenPoint } from "@/screens/overview/TokenUsageChart";

/** Consommation réelle de tokens, agrégée par jour depuis le ledger — remplace la fixture. */
export function useTokenUsage() {
  const [data, setData] = useState<TokenPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<TokenPoint[]>("/api/tokens/weekly")
      .then((points) => {
        if (!cancelled) setData(points);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { data: data ?? [], loading: data === null && !error, error };
}
