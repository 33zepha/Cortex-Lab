import { config } from "dotenv";

config();

const baseUrl = (process.env.CORTEX_API_BASE_URL ?? `http://127.0.0.1:${process.env.API_PORT ?? 8080}`).replace(/\/$/, "");
const apiToken = process.env.CORTEX_API_TOKEN?.trim();

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    ...(apiToken ? { authorization: `Bearer ${apiToken}` } : {}),
    ...extra,
  };
}

type EventPage = {
  total: number;
};

const eventsResponse = await fetch(`${baseUrl}/api/events?cursor=0&limit=1`, { headers: headers() });
if (!eventsResponse.ok) throw new Error(`events endpoint failed: ${eventsResponse.status} ${await eventsResponse.text()}`);
const page = await eventsResponse.json() as EventPage;
if (page.total < 2) throw new Error(`Need at least 2 ledger events for SSE resume smoke test, got ${page.total}`);

const lastEventId = page.total - 2;
const expectedNextId = lastEventId + 1;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5_000);

try {
  const response = await fetch(`${baseUrl}/api/stream?cursor=0`, {
    headers: headers({ "last-event-id": String(lastEventId) }),
    signal: controller.signal,
  });
  if (!response.ok || !response.body) throw new Error(`stream endpoint failed: ${response.status} ${response.statusText}`);

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let observedId: number | null = null;

  while (observedId === null) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const match = buffer.match(/(?:^|\n)id:\s*(\d+)\s*\n/);
    if (match) observedId = Number(match[1]);
  }

  if (observedId !== expectedNextId) {
    throw new Error(`SSE resume mismatch: Last-Event-ID=${lastEventId}, expected next id=${expectedNextId}, got ${String(observedId)}`);
  }

  console.log(`[sse-smoke] PASS Last-Event-ID=${lastEventId} resumed at id=${observedId}`);
  await reader.cancel();
} finally {
  clearTimeout(timeout);
  controller.abort();
}
