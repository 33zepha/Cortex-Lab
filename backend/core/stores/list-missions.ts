import { promises as fs } from "node:fs";
import path from "node:path";
import { MissionEntity } from "../contracts/mission";

/** Utilitaire de lecture — pas dans le contrat MissionRepository (DECISIONS.md #11 : pas d'ajout prématuré). */
export async function listMissionIds(dir: string): Promise<string[]> {
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
  return files.filter((f) => f.endsWith(".json")).map((f) => path.basename(f, ".json"));
}

export async function listMissions(dir: string): Promise<MissionEntity[]> {
  const ids = await listMissionIds(dir);
  const missions = await Promise.all(
    ids.map(async (id) => MissionEntity.parse(JSON.parse(await fs.readFile(path.join(dir, `${id}.json`), "utf8")))),
  );
  return missions.sort((a, b) => b.createdAt - a.createdAt);
}
