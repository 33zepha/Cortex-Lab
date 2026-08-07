import { NodeSSH } from "node-ssh";
import type { VpsConfig } from "./vps-config";

export type ExecResult = { code: number | null; stdout: string; stderr: string };

const IGNORED_DIRS = new Set([".git", "node_modules", "dist"]);

/** Fine couche autour de node-ssh : isole les détails SSH du reste du domaine. */
export class SshClient {
  private readonly ssh = new NodeSSH();
  private connected = false;

  constructor(private readonly config: VpsConfig) {}

  async connect(): Promise<void> {
    if (this.connected) return;
    await this.ssh.connect({
      host: this.config.host,
      port: this.config.port,
      username: this.config.username,
      password: this.config.password,
      privateKey: this.config.privateKey,
    });
    this.connected = true;
  }

  async exec(command: string, cwd?: string): Promise<ExecResult> {
    await this.connect();
    const result = await this.ssh.execCommand(command, cwd ? { cwd } : undefined);
    return { code: result.code, stdout: result.stdout, stderr: result.stderr };
  }

  async uploadDirectory(localDir: string, remoteDir: string): Promise<void> {
    await this.connect();
    const ok = await this.ssh.putDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 4,
      validate: (itemPath) => !IGNORED_DIRS.has(basename(itemPath)),
    });
    if (!ok) throw new Error(`Échec de l'upload vers ${remoteDir}`);
  }

  async downloadDirectory(remoteDir: string, localDir: string): Promise<void> {
    await this.connect();
    const ok = await this.ssh.getDirectory(localDir, remoteDir, {
      recursive: true,
      concurrency: 4,
      validate: (itemPath) => !IGNORED_DIRS.has(basename(itemPath)),
    });
    if (!ok) throw new Error(`Échec du téléchargement depuis ${remoteDir}`);
  }

  dispose(): void {
    if (this.connected) {
      this.ssh.dispose();
      this.connected = false;
    }
  }
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/);
  return parts.at(-1) ?? p;
}
