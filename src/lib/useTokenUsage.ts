import useSWR from "swr";
import { apiFetch, shouldRetryOnError } from "@/lib/api";
import type { TokenPoint } from "@/screens/overview/TokenUsageChart";

/** Consommation réelle de tokens avec polling SWR. */
export function useTokenUsage() {
  const { data, error, isLoading } = useSWR<TokenPoint[]>(
    "/api/tokens/weekly",
    apiFetch,
    { refreshInterval: 60000, revalidateOnFocus: true, shouldRetryOnError }
  );

  return { 
    data: data ?? [], 
    loading: isLoading, 
    error: error instanceof Error ? error.message : error ? String(error) : null 
  };
}
