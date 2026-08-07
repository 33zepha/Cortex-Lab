import type { Policy, PolicyAction } from "../contracts/policy";

export type PolicyLimits = {
  tokenBudget: number;
  timeoutSeconds: number;
  allowedPathPrefixes: string[];
  allowedCommands: string[];
  deniedPathPrefixes?: string[];
};

const DEFAULT_DENIED_PATHS = [".git/", ".env", "node_modules/", "dist/", ".cortex/"];

/** Policy réellement consultée par le runner avant/après chaque étape. */
export class SimplePolicy implements Policy {
  version = "1.0.0" as const;

  constructor(private readonly limits: PolicyLimits) {}

  authorize(action: PolicyAction): boolean {
    if (action.action === "read_file" || action.action === "write_file") {
      const target = normalizePath(action.target);
      const denied = [...DEFAULT_DENIED_PATHS, ...(this.limits.deniedPathPrefixes ?? [])];
      if (denied.some((prefix) => target === prefix.replace(/\/$/, "") || target.startsWith(prefix))) return false;
      return this.limits.allowedPathPrefixes.some((prefix) => target.startsWith(normalizePath(prefix)));
    }
    if (action.action === "execute_command") {
      return this.limits.allowedCommands.includes(action.target);
    }
    return false;
  }

  tokenBudgetFor(_missionId: string): number {
    return this.limits.tokenBudget;
  }

  timeoutSecondsFor(_missionId: string): number {
    return this.limits.timeoutSeconds;
  }
}

function normalizePath(value: string): string {
  const normalized = value.replaceAll("\\", "/").replace(/^\.\//, "");
  return normalized === "." ? "" : normalized;
}
