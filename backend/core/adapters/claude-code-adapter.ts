import type { ModelAdapter, ModelResult, RunnerTask } from "../contracts/model-adapter";
import type { VpsConfig } from "../infra/vps-config";
import { SshClient } from "../infra/ssh-client";
import { gitModifiedFiles } from "../workspace/workspace-manager";

export type ClaudeCodeAdapterOptions = {
  vps: VpsConfig;
  /** Répertoire distant de base sur le VPS, ex: /root/cortex-workspaces */
  remoteWorkspaceBase: string;
  permissionMode?: "acceptEdits" | "bypassPermissions";
};

/**
 * Seule implémentation réelle de ModelAdapter (DECISIONS.md #8). Exécute Claude Code
 * via SSH sur le VPS, dans une copie du workspace local uploadée puis synchronisée en
 * retour. Aucun fallback silencieux : une erreur SSH/CLI se traduit par `success: false`.
 */
export class ClaudeCodeAdapter implements ModelAdapter {
  version = "1.0.0" as const;

  constructor(private readonly options: ClaudeCodeAdapterOptions) {}

  async health(): Promise<{ available: boolean; rateLimit?: number }> {
    const ssh = new SshClient(this.options.vps);
    try {
      const result = await ssh.exec("claude --version");
      return { available: result.code === 0 };
    } catch {
      return { available: false };
    } finally {
      ssh.dispose();
    }
  }

  estimateTokens(task: RunnerTask): number {
    return task.objective.length + task.context.length + task.constraints.length;
  }

  async execute(task: RunnerTask): Promise<ModelResult> {
    const remoteDir = `${this.options.remoteWorkspaceBase}/${task.missionId}`;
    const ssh = new SshClient(this.options.vps);
    const startedAt = Date.now();

    try {
      await ssh.uploadDirectory(task.workspace.root, remoteDir);

      const prompt = [task.objective, task.constraints && `Contraintes: ${task.constraints}`, task.context]
        .filter(Boolean)
        .join("\n\n");
      const permissionMode = this.options.permissionMode ?? "acceptEdits";
      const command = `claude -p ${shellQuote(prompt)} --permission-mode ${permissionMode} --output-format json`;

      const run = await ssh.exec(command, remoteDir);
      await ssh.downloadDirectory(remoteDir, task.workspace.root);

      const filesModified = gitModifiedFiles(task.workspace.root);
      const parsed = parseCliJson(run.stdout);

      if (!parsed) {
        return {
          success: false,
          output: run.stdout || run.stderr,
          filesModified,
          filesRead: [],
          error: "Sortie Claude Code non-JSON (--output-format json attendu)",
          metadata: { tokensUsed: 0, duration: Date.now() - startedAt },
        };
      }

      const u = parsed.usage;
      const tokensUsed = u ? u.input_tokens + u.output_tokens + u.cache_creation_input_tokens + u.cache_read_input_tokens : 0;

      return {
        success: run.code === 0 && !parsed.is_error,
        output: parsed.result ?? "",
        filesModified,
        filesRead: [], // non exposé par le CLI, même en JSON ; nécessiterait --output-format stream-json
        error: parsed.is_error ? (parsed.result ?? "Claude Code a retourné une erreur") : undefined,
        metadata: { tokensUsed, duration: parsed.duration_ms ?? Date.now() - startedAt },
      };
    } catch (err) {
      return {
        success: false,
        output: "",
        filesModified: [],
        filesRead: [],
        error: err instanceof Error ? err.message : String(err),
        metadata: { tokensUsed: 0, duration: Date.now() - startedAt },
      };
    } finally {
      await ssh.exec(`rm -rf ${remoteDir}`).catch(() => undefined);
      ssh.dispose();
    }
  }
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

type CliJsonResult = {
  is_error: boolean;
  result?: string;
  duration_ms?: number;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
};

/** `claude -p ... --output-format json` renvoie un unique objet JSON sur stdout. */
function parseCliJson(stdout: string): CliJsonResult | null {
  try {
    const parsed = JSON.parse(stdout.trim());
    if (typeof parsed !== "object" || parsed === null || typeof parsed.is_error !== "boolean") return null;
    return parsed as CliJsonResult;
  } catch {
    return null;
  }
}
