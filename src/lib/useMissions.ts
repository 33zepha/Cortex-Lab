import { useCallback, useSyncExternalStore } from "react";
import useSWR from "swr";
import type { Mission } from "@/lib/types";
import { apiFetch, shouldRetryOnError } from "@/lib/api";
import { useCortexStream } from "@/lib/useCortexStream";
import {
  getOperatorSimulatorSnapshot,
  isOperatorSimulatorEnabled,
  subscribeOperatorSimulator,
} from "@/lib/operator-simulator";

function useSimulatorSnapshot() {
  return useSyncExternalStore(
    subscribeOperatorSimulator,
    getOperatorSimulatorSnapshot,
    getOperatorSimulatorSnapshot,
  );
}

/** Source canonique = API ; SSE invalide immédiatement, le polling reste un filet de sécurité. */
export function useMissions() {
  const simulatorEnabled = isOperatorSimulatorEnabled();
  const simulator = useSimulatorSnapshot();
  const { data, error, isLoading, mutate } = useSWR<Mission[]>(
    simulatorEnabled ? null : "/api/missions",
    apiFetch,
    { refreshInterval: 15_000, revalidateOnFocus: true, shouldRetryOnError },
  );

  const onEvent = useCallback(() => {
    void mutate();
  }, [mutate]);
  useCortexStream(onEvent, !simulatorEnabled);

  const refetch = useCallback(() => {
    if (simulatorEnabled) return Promise.resolve(simulator.missions);
    return mutate();
  }, [mutate, simulator.missions, simulatorEnabled]);

  return {
    missions: simulatorEnabled ? simulator.missions : data ?? null,
    incidents: simulatorEnabled ? simulator.incidents : [],
    loading: simulatorEnabled ? false : isLoading,
    error: simulatorEnabled
      ? null
      : error instanceof Error
        ? error.message
        : error
          ? String(error)
          : null,
    refetch,
    simulated: simulatorEnabled,
  };
}

export function useMission(id: string | undefined) {
  const simulatorEnabled = isOperatorSimulatorEnabled();
  const simulator = useSimulatorSnapshot();
  const { data, error, isLoading, mutate } = useSWR<Mission>(
    simulatorEnabled || !id ? null : `/api/missions/${id}`,
    apiFetch,
    { refreshInterval: 15_000, revalidateOnFocus: true, shouldRetryOnError },
  );

  const onEvent = useCallback((event: { missionId: string }) => {
    if (event.missionId === id) void mutate();
  }, [id, mutate]);
  useCortexStream(onEvent, !simulatorEnabled);

  const simulatedMission = simulator.missions.find((mission) => mission.id === id) ?? null;
  const refetch = useCallback(() => {
    if (simulatorEnabled) return Promise.resolve(simulatedMission);
    return mutate();
  }, [mutate, simulatedMission, simulatorEnabled]);

  return {
    mission: simulatorEnabled ? simulatedMission : data ?? null,
    loading: simulatorEnabled ? false : isLoading,
    error: simulatorEnabled
      ? simulatedMission ? null : "Mission simulée introuvable"
      : error instanceof Error
        ? error.message
        : error
          ? String(error)
          : null,
    refetch,
    simulated: simulatorEnabled,
  };
}
