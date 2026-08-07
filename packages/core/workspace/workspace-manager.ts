import { promises as fs } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

export type Workspace = {
  missionId: string;
  root: string;
};

const EXCLUDED = new Set(["node_modules", ".git", "dist", ".cortex"]);
const GIT_IDENTITY = ["-c", "user.email=cortex@local", "-c", "user.name=Cortex"];

/** Copie isolée par mission (DECISIONS.md #7) : aucune modification du projet source, output = patch. */
export class WorkspaceManager {
  constructor(private readonly baseDir: string) {}

  async create(missionId: string, sourceRoot: string): Promise<Workspace> {
    const root = path.join(this.baseDir, missionId);
    await fs.mkdir(root, { recursive: true });
    await fs.cp(sourceRoot, root, {
      recursive: true,
      filter: (src) => !EXCLUDED.has(path.basename(src)),
    });
    execFileSync("git", [...GIT_IDENTITY, "init", "-q"], { cwd: root });
    execFileSync("git", [...GIT_IDENTITY, "add", "-A"], { cwd: root });
    execFileSync("git", [...GIT_IDENTITY, "commit", "-q", "--allow-empty", "-m", "baseline"], { cwd: root });
    return { missionId, root };
  }

  async cleanup(workspace: Workspace): Promise<void> {
    await fs.rm(workspace.root, { recursive: true, force: true });
  }
}

/** Diff complet (fichiers modifiés + nouveaux) vs le commit baseline. Fonctions pures : pas besoin d'un WorkspaceManager. */
export function gitDiff(root: string): string {
  execFileSync("git", [...GIT_IDENTITY, "add", "-A"], { cwd: root });
  return execFileSync("git", ["diff", "--cached", "HEAD"], { cwd: root, encoding: "utf8" });
}

export function gitModifiedFiles(root: string): string[] {
  execFileSync("git", [...GIT_IDENTITY, "add", "-A"], { cwd: root });
  const out = execFileSync("git", ["diff", "--cached", "--name-only", "HEAD"], { cwd: root, encoding: "utf8" });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}
