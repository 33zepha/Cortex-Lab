import type { ModelAdapter, ModelResult, ModelTokenUsage, RunnerTask } from "../contracts/model-adapter";
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
    const criteria = task.acceptanceCriteria?.join("\n") ?? "";
    const capabilities = task.preferredCapabilities?.join(",") ?? "";
    const chars = task.objective.length + task.step.length + task.context.length + task.constraints.length + criteria.length + capabilities.length;
    return Math.max(1, Math.ceil(chars / 4));
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
        task.taskId && `Task ID: ${task.taskId}`,
        `Étape courante: ${task.step}`,
        task.acceptanceCriteria?.length && `Critères d'acceptation:\n- ${task.acceptanceCriteria.join("\n- ")}`,
        task.preferredCapabilities?.length && `Capacités attendues: ${task.preferredCapabilities.join(", ")}`,
        task.risk && `Niveau de risque: ${task.risk}`,
        task.constraints && `Contraintes: ${task.constraints}`,
        task.context && `Contexte des dépendances terminées:\n${task.context}`,
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

      const tokenUsage = summarizeClaudeUsage(parsed.usage);

      return {
        success: run.code === 0 && !parsed.is_error,
        output: parsed.result ?? "",
        filesModified,
        filesRead: [],
        error: parsed.is_error ? (parsed.result ?? "Claude Code a retourné une erreur") : undefined,
        metadata: {
          tokensUsed: tokenUsage.activeTokens,
          duration: parsed.duration_ms ?? Date.now() - startedAt,
          tokenUsage,
        },
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

export type ClaudeCliUsage = {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
};

export function summarizeClaudeUsage(usage?: ClaudeCliUsage): ModelTokenUsage {
  const inputTokens = positiveInt(usage?.input_tokens);
  const outputTokens = positiveInt(usage?.output_tokens);
  const cacheCreationInputTokens = positiveInt(usage?.cache_creation_input_tokens);
  const cacheReadInputTokens = positiveInt(usage?.cache_read_input_tokens);
  const activeTokens = inputTokens + outputTokens;

  return {
    activeTokens,
    inputTokens,
    outputTokens,
    cacheCreationInputTokens,
    cacheReadInputTokens,
    totalContextTokens: activeTokens + cacheCreationInputTokens + cacheReadInputTokens,
  };
}

function positiveInt(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

type CliJsonResult = {
  is_error: boolean;
  result?: string;
  duration_ms?: number;
  usage?: ClaudeCliUsage;
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
