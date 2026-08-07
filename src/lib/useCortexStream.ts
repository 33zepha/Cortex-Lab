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

const STREAM_CURSOR_KEY = "cortex.stream.lastEventId";

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

function readInitialCursor(): number {
  try {
    const stored = window.sessionStorage.getItem(STREAM_CURSOR_KEY);
    const lastEventId = Number(stored);
    return Number.isInteger(lastEventId) && lastEventId >= 0 ? lastEventId + 1 : 0;
  } catch {
    return 0;
  }
}

function rememberLastEventId(raw: MessageEvent): void {
  const lastEventId = Number(raw.lastEventId);
  if (!Number.isInteger(lastEventId) || lastEventId < 0) return;
  try {
    window.sessionStorage.setItem(STREAM_CURSOR_KEY, String(lastEventId));
  } catch {
    // Le stream reste fonctionnel même si le stockage navigateur est indisponible.
  }
}

/**
 * Reçoit le ledger Cortex en temps réel.
 * EventSource se reconnecte automatiquement et le serveur reprend après Last-Event-ID.
 * Le cursor session évite aussi de rejouer tout le ledger après un remount de l'UI.
 */
export function useCortexStream(onEvent: (event: CortexStreamEvent) => void): void {
  useEffect(() => {
    if (typeof EventSource === "undefined") return;
    const cursor = readInitialCursor();
    const source = new EventSource(apiUrl(`/api/stream?cursor=${cursor}`));

    const listeners = EVENT_TYPES.map((type) => {
      const listener = (raw: Event) => {
        if (!(raw instanceof MessageEvent)) return;
        try {
          const event = JSON.parse(raw.data) as CortexStreamEvent;
          rememberLastEventId(raw);
          onEvent(event);
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
