import { promises as fs } from "node:fs";
import path from "node:path";
import type { EventStore } from "../contracts/stores";
import type { DomainEventEnvelope } from "../contracts/events";
import { parseDomainEvent } from "../contracts/events";

/**
 * Ledger append-only NDJSON (DECISIONS.md #3). Un seul fichier pour toutes les missions ;
 * `seq` est monotone par mission, assigné ici (l'appelant fournit un seq provisoire ignoré).
 * Écriture sérialisée en mémoire (file d'attente de promesses) + un seul appel `appendFile`
 * par ligne pour limiter le risque d'écriture partielle. En lecture, toute ligne corrompue
 * (coupure en cours d'écriture) est ignorée plutôt que de faire échouer tout le rejeu.
 */
export class NdjsonEventStore implements EventStore {
  version = "1.0.0" as const;
  private writeQueue: Promise<unknown> = Promise.resolve();
  private readonly seqCache = new Map<string, number>();

  constructor(private readonly filePath: string) {}

  async append(event: DomainEventEnvelope): Promise<{ seq: number }> {
    return this.enqueue(async () => {
      const seq = await this.nextSeq(event.missionId);
      const finalEvent: DomainEventEnvelope = { ...event, seq };
      parseDomainEvent(finalEvent);
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.appendFile(this.filePath, JSON.stringify(finalEvent) + "\n", "utf8");
      this.seqCache.set(event.missionId, seq);
      return { seq };
    });
  }

  private enqueue<T>(fn: () => Promise<T>): Promise<T> {
    const result = this.writeQueue.then(fn);
    this.writeQueue = result.catch(() => undefined);
    return result;
  }

  private async nextSeq(missionId: string): Promise<number> {
    const cached = this.seqCache.get(missionId);
    if (cached !== undefined) return cached + 1;
    const events = await this.readAll(missionId);
    return (events.at(-1)?.seq ?? -1) + 1;
  }

  async *readSince(missionId: string, fromSeq: number): AsyncIterable<DomainEventEnvelope> {
    const events = await this.readAll(missionId);
    for (const event of events) {
      if (event.seq >= fromSeq) yield event;
    }
  }

  async readAll(missionId: string): Promise<DomainEventEnvelope[]> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, "utf8");
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    const events: DomainEventEnvelope[] = [];
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch {
        continue; // ligne corrompue : ignorée, jamais de crash au rejeu
      }
      const envelope = parseDomainEvent(parsed);
      if (envelope.missionId === missionId) events.push(envelope);
    }
    return events.sort((a, b) => a.seq - b.seq);
  }
}

/** Lecture toutes missions confondues — pour les vues agrégées (health, etc.), pas pour le rejeu métier. */
export async function readEntireLedger(filePath: string): Promise<DomainEventEnvelope[]> {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  const events: DomainEventEnvelope[] = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      events.push(parseDomainEvent(JSON.parse(line)));
    } catch {
      continue;
    }
  }
  return events;
}
