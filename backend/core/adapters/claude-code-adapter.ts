import type { ModelAdapter, ModelResult, RunnerTask } from "../contracts/model-adapter";
import type { VpsConfig } from "../infra/vps-config";
import { SshClient } from "../infra/ssh-client";
import { gitModifiedFiles } from "../workspace/workspace-manager";

export type ClaudeCodeAdapterOptions = {
  vps: VpsConfig;
  remoteWorkspaceBase: string;
  permissionMode?: "acceptEdits" | "bypassPermissions";
};

/** Exécute Claude Code sur le VPS dans le workspace isolé de la mission. */
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
    return task.objective.length + task.step.length + task.context.length + task.constraints.length;
  }

  async execute(task: RunnerTask): Promise<ModelResult> {
    const remoteDir = `${this.options.remoteWorkspaceBase}/${task.missionId}`;
    const ssh = new SshClient(this.options.vps);
    const startedAt = Date.now();

    try {
      if (task.signal?.aborted) return cancelledResult(startedAt);
      await ssh.uploadDirectory(task.workspace.root, remoteDir);
      if (task.signal?.aborted) return cancelledResult(startedAt);

      const prompt = [
        `Objectif global: ${task.objective}`,
        `Étape courante: ${task.step}`,
        task.constraints && `Contraintes: ${task.constraints}`,
        task.context && `Contexte des étapes précédentes:\n${task.context}`,
      ]
        .filter(Boolean)
        .join("\n\n");

      const permissionMode = this.options.permissionMode ?? "acceptEdits";
      const command = `claude -p ${shellQuote(prompt)} --permission-mode ${permissionMode} --output-format json`;
      const run = await ssh.exec(command, remoteDir, task.signal);

      if (task.signal?.aborted) return cancelledResult(startedAt);
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
        filesRead: [],
        error: parsed.is_error ? (parsed.result ?? "Claude Code a retourné une erreur") : undefined,
        metadata: { tokensUsed, duration: parsed.duration_ms ?? Date.now() - startedAt },
      };
    } catch (err) {
      if (task.signal?.aborted || (err instanceof Error && err.name === "AbortError")) {
        return cancelledResult(startedAt);
      }
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

function cancelledResult(startedAt: number): ModelResult {
  return {
    success: false,
    output: "",
    filesModified: [],
    filesRead: [],
    error: "Mission annulée",
    metadata: { tokensUsed: 0, duration: Date.now() - startedAt },
  };
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

function parseCliJson(stdout: string): CliJsonResult | null {
  try {
    const parsed = JSON.parse(stdout.trim());
    if (typeof parsed !== "object" || parsed === null || typeof parsed.is_error !== "boolean") return null;
    return parsed as CliJsonResult;
  } catch {
    return null;
  }
}
