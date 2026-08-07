import { useEffect } from "react";
import { apiUrl } from "@/lib/api";

const EVENT_TYPES = [
  "mission.created",
  "plan.ready",
  "step.started",
  "file.read",
  "file.modified",
  "test.completed",
  "evidence.recorded",
  "decision.requested",
  "decision.provided",
  "mission.cancelled",
  "mission.closed",
] as const;

export type CortexStreamEvent = {
  id: string;
  missionId: string;
  seq: number;
  type: string;
  v: string;
  ts: number;
  actor: string;
  payload: Record<string, unknown>;
};

/** Reçoit le ledger Cortex en temps réel. EventSource gère automatiquement la reconnexion. */
export function useCortexStream(onEvent: (event: CortexStreamEvent) => void): void {
  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const source = new EventSource(apiUrl("/api/stream"));

    const listeners = EVENT_TYPES.map((type) => {
      const listener = (raw: Event) => {
        if (!(raw instanceof MessageEvent)) return;
        try {
          onEvent(JSON.parse(raw.data) as CortexStreamEvent);
        } catch {
          // Un événement malformé ne doit jamais casser la synchronisation UI.
        }
      };
      source.addEventListener(type, listener);
      return { type, listener };
    });

    return () => {
      for (const { type, listener } of listeners) source.removeEventListener(type, listener);
      source.close();
    };
  }, [onEvent]);
}
