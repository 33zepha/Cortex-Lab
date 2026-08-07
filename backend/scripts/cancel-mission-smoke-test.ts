import { config } from "dotenv";

config();

const baseUrl = (process.env.CORTEX_API_BASE_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? 8080}`).replace(/\/$/, "");
const apiToken = process.env.CORTEX_API_TOKEN?.trim();
const objective = `Cancellation smoke ${Date.now()}: inspecte le playground et produis une analyse détaillée avant toute modification.`;

function headers(json = false): Record<string, string> {
  const result: Record<string, string> = {};
  if (json) result["content-type"] = "application/json";
  if (apiToken) result.authorization = `Bearer ${apiToken}`;
  return result;
}

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${text}`);
  return JSON.parse(text) as T;
}

async function waitFor<T>(label: string, read: () => Promise<T | null>, timeoutMs = 30_000): Promise<T> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await read();
    if (value !== null) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timeout: ${label}`);
}

type LedgerEvent = {
  missionId: string;
  type: string;
  payload: Record<string, unknown>;
};

type EventPage = {
  total: number;
  events: LedgerEvent[];
};

type MissionResponse = {
  id: string;
  status: string;
};

const before = await json<EventPage>(`${baseUrl}/api/events?cursor=0&limit=1`, { headers: headers() });
const startCursor = before.total;

console.log(`[cancel-smoke] starting mission from ledger cursor ${startCursor}`);
const createPromise = fetch(`${baseUrl}/api/missions`, {
  method: "POST",
  headers: headers(true),
  body: JSON.stringify({
    objective,
    constraints: "Smoke test d'annulation. Ne modifie aucun fichier.",
    model: process.env.OPENAI_MODEL ?? "gpt-5.6",
  }),
});

const missionId = await waitFor("mission.created", async () => {
  const page = await json<EventPage>(`${baseUrl}/api/events?cursor=${startCursor}&limit=200`, { headers: headers() });
  const created = page.events.find((event) => event.type === "mission.created" && event.payload.objective === objective);
  return created?.missionId ?? null;
});
console.log(`[cancel-smoke] mission ${missionId} created`);

await waitFor("step.started", async () => {
  const page = await json<EventPage>(`${baseUrl}/api/events?cursor=${startCursor}&limit=200`, { headers: headers() });
  const started = page.events.some((event) => event.missionId === missionId && event.type === "step.started");
  return started ? true : null;
});
console.log("[cancel-smoke] execution started, sending cancel");

const cancel = await json<{ id: string; status: string }>(`${baseUrl}/api/missions/${missionId}/cancel`, {
  method: "POST",
  headers: headers(true),
  body: JSON.stringify({ reason: "Cortex cancellation smoke test" }),
});
if (cancel.status !== "cancelling") throw new Error(`Unexpected cancel response: ${JSON.stringify(cancel)}`);

const createResponse = await createPromise;
const createText = await createResponse.text();
if (!createResponse.ok) throw new Error(`Mission request failed: ${createResponse.status} ${createText}`);
const mission = JSON.parse(createText) as MissionResponse;
if (mission.id !== missionId) throw new Error(`Mission id mismatch: expected ${missionId}, got ${mission.id}`);
if (mission.status !== "cancelled") throw new Error(`Mission did not cancel: status=${mission.status}`);

const page = await json<EventPage>(`${baseUrl}/api/events?cursor=${startCursor}&limit=200`, { headers: headers() });
const missionEvents = page.events.filter((event) => event.missionId === missionId);
const cancelledCount = missionEvents.filter((event) => event.type === "mission.cancelled").length;
const closedCount = missionEvents.filter((event) => event.type === "mission.closed").length;
if (cancelledCount !== 1) throw new Error(`Expected exactly one mission.cancelled event, got ${cancelledCount}`);
if (closedCount !== 0) throw new Error(`Cancelled mission unexpectedly emitted mission.closed (${closedCount})`);

console.log(`[cancel-smoke] PASS ${missionId}: AbortSignal reached execution and mission ended cancelled`);
