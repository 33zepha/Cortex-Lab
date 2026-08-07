import { describe, expect, it } from "vitest";
import { parseMissionPlan } from "../contracts/mission-plan";

const baseTask = {
  objective: "Inspecter le projet",
  acceptanceCriteria: ["Le périmètre est identifié"],
  dependencies: [] as string[],
  risk: "low" as const,
  preferredCapabilities: ["code.read"],
};

describe("MissionPlan v2", () => {
  it("accepte un DAG valide", () => {
    const plan = parseMissionPlan({
      version: "2.0.0",
      tasks: [
        { ...baseTask, id: "inspect" },
        { ...baseTask, id: "implement", dependencies: ["inspect"] },
      ],
    });

    expect(plan.tasks).toHaveLength(2);
  });

  it("refuse une dépendance inconnue", () => {
    expect(() => parseMissionPlan({
      version: "2.0.0",
      tasks: [{ ...baseTask, id: "implement", dependencies: ["missing"] }],
    })).toThrow();
  });

  it("refuse les ids dupliqués", () => {
    expect(() => parseMissionPlan({
      version: "2.0.0",
      tasks: [{ ...baseTask, id: "same" }, { ...baseTask, id: "same" }],
    })).toThrow();
  });

  it("refuse les cycles", () => {
    expect(() => parseMissionPlan({
      version: "2.0.0",
      tasks: [
        { ...baseTask, id: "a", dependencies: ["b"] },
        { ...baseTask, id: "b", dependencies: ["a"] },
      ],
    })).toThrow();
  });
});
