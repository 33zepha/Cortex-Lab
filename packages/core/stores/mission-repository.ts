import { promises as fs } from "node:fs";
import path from "node:path";
import type { MissionRepository } from "../contracts/stores";
import { MissionEntity } from "../contracts/mission";

/**
 * Projection persistée en JSON (DECISIONS.md #6). Le ledger reste la source de vérité ;
 * ce store ne fait que cacher la dernière projection connue pour lecture rapide.
 * Écriture atomique : write vers un fichier temporaire puis `rename` (jamais de fichier
 * à moitié écrit lisible depuis `findById`).
 */
export class FileMissionRepository implements MissionRepository {
  version = "1.0.0" as const;

  constructor(private readonly dir: string) {}

  async create(mission: MissionEntity): Promise<void> {
    await this.write(mission);
  }

  async update(mission: MissionEntity): Promise<void> {
    await this.write(mission);
  }

  async findById(id: string): Promise<MissionEntity | null> {
    try {
      const raw = await fs.readFile(this.pathFor(id), "utf8");
      return MissionEntity.parse(JSON.parse(raw));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  private async write(mission: MissionEntity): Promise<void> {
    const validated = MissionEntity.parse(mission);
    await fs.mkdir(this.dir, { recursive: true });
    const finalPath = this.pathFor(validated.id);
    const tmpPath = `${finalPath}.${process.pid}.tmp`;
    await fs.writeFile(tmpPath, JSON.stringify(validated, null, 2), "utf8");
    await fs.rename(tmpPath, finalPath);
  }

  private pathFor(id: string): string {
    return path.join(this.dir, `${id}.json`);
  }
}
