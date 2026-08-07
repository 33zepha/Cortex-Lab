import { promises as fs } from "node:fs";
import path from "node:path";
import { ulid } from "ulid";
import type { EvidenceStore, Evidence } from "../contracts/stores";
import { redactSecrets } from "./redact";

/** Stockage fichier par mission (DECISIONS.md #6), secrets redactés avant écriture. */
export class FileEvidenceStore implements EvidenceStore {
  version = "1.0.0" as const;

  constructor(private readonly dir: string) {}

  async record(missionId: string, type: Evidence["type"], content: unknown): Promise<void> {
    const redacted = redactSecrets(content);
    const evidence: Evidence = {
      id: ulid(),
      type,
      content: typeof redacted === "string" ? redacted : JSON.stringify(redacted, null, 2),
      timestamp: Date.now(),
    };
    const missionDir = path.join(this.dir, missionId);
    await fs.mkdir(missionDir, { recursive: true });
    await fs.writeFile(path.join(missionDir, `${evidence.id}.json`), JSON.stringify(evidence, null, 2), "utf8");
  }

  async list(missionId: string): Promise<Evidence[]> {
    const missionDir = path.join(this.dir, missionId);
    let files: string[];
    try {
      files = await fs.readdir(missionDir);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw err;
    }
    const evidences = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => JSON.parse(await fs.readFile(path.join(missionDir, f), "utf8")) as Evidence),
    );
    return evidences.sort((a, b) => a.timestamp - b.timestamp);
  }
}
