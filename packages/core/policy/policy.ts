import type { Policy, PolicyAction } from "../contracts/policy";

export type PolicyLimits = {
  tokenBudget: number;
  timeoutSeconds: number;
  allowedPathPrefixes: string[];
  allowedCommands: string[];
};

/** Implémentation simple mais réellement appliquée — pas un stub qui retourne toujours true (NEXT.md). */
export class SimplePolicy implements Policy {
  version = "1.0.0" as const;

  constructor(private readonly limits: PolicyLimits) {}

  authorize(action: PolicyAction): boolean {
    if (action.action === "read_file" || action.action === "write_file") {
      return this.limits.allowedPathPrefixes.some((prefix) => action.target.startsWith(prefix));
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
