import type { DomainEventEnvelope } from "./events";
import type { MissionEntity } from "./mission";

export interface EventStore {
  version: "1.0.0";
  append(event: DomainEventEnvelope): Promise<{ seq: number }>;
  readSince(missionId: string, fromSeq: number): AsyncIterable<DomainEventEnvelope>;
  readAll(missionId: string): Promise<DomainEventEnvelope[]>;
}

export interface MissionRepository {
  version: "1.0.0";
  create(mission: MissionEntity): Promise<void>;
  findById(id: string): Promise<MissionEntity | null>;
  update(mission: MissionEntity): Promise<void>;
}

export type Evidence = {
  id: string; // ULID
  type: "test" | "diff" | "artifact" | "log";
  content: string;
  timestamp: number;
};

export interface EvidenceStore {
  version: "1.0.0";
  record(missionId: string, type: Evidence["type"], content: unknown): Promise<void>;
  list(missionId: string): Promise<Evidence[]>;
}
