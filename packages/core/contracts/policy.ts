export type PolicyAction = {
  actor: "mission" | "api";
  action: "read_file" | "write_file" | "execute_command";
  target: string;
  missionId: string;
};

export interface Policy {
  version: "1.0.0";
  authorize(action: PolicyAction): boolean;
  tokenBudgetFor(missionId: string): number;
  timeoutSecondsFor(missionId: string): number;
}
