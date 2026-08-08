import { describe, expect, it } from "vitest";
import {
  applyOperatorCommand,
  createOperatorScenario,
} from "../../../src/lib/operator-simulator.js";
import { getOperationalMission } from "../../../src/lib/operator-contract.js";

describe("operator simulator", () => {
  const now = Date.parse("2026-08-08T17:00:00Z");

  it("covers the critical operator states without mixing fixtures into live data", () => {
    const scenario = createOperatorScenario(now);
    const statuses = scenario.missions.map((mission) => getOperationalMission(mission).status);

    expect(statuses).toContain("running");
    expect(statuses).toContain("waiting_for_human");
    expect(statuses).toContain("failed");
    expect(statuses).toContain("paused");
    expect(statuses).toContain("succeeded");
    expect(scenario.incidents).toHaveLength(1);
  });

  it("derives measured progress from durable stages", () => {
    const scenario = createOperatorScenario(now);
    const mission = scenario.missions.find((item) => item.id === "SIM-RUNNING-3H");
    expect(mission).toBeDefined();

    const view = getOperationalMission(mission!);
    expect(view.progress).toBe(50);
    expect(view.stageLabel).toBe("Valider les quatre viewports");
    expect(view.capabilities.canPause).toBe(true);
    expect(view.capabilities.canAddInstruction).toBe(true);
  });

  it("resumes a waiting run after approval", () => {
    const scenario = createOperatorScenario(now);
    const mission = scenario.missions.find((item) => item.id === "SIM-DECISION");
    expect(mission).toBeDefined();

    const approved = applyOperatorCommand(mission!, "approve", {}, now + 1_000);
    const view = getOperationalMission(approved);

    expect(view.status).toBe("running");
    expect(view.decision).toBeNull();
    expect(approved.decisionRequired).toBe(false);
    expect(approved.timeline.at(-1)?.title).toBe("Décision approuvée");
  });

  it("creates a new run instead of rewriting failed history on retry", () => {
    const scenario = createOperatorScenario(now);
    const mission = scenario.missions.find((item) => item.id === "SIM-FAILED");
    expect(mission).toBeDefined();

    const retried = applyOperatorCommand(mission!, "retry", {}, now + 1_000);
    const view = getOperationalMission(retried);

    expect(retried.id).not.toBe(mission!.id);
    expect(view.attempt).toBe(2);
    expect(view.status).toBe("running");
    expect(retried.error).toBeNull();
    expect(mission!.status).toBe("failed");
  });

  it("records an operator instruction in the run chronology", () => {
    const scenario = createOperatorScenario(now);
    const mission = scenario.missions.find((item) => item.id === "SIM-PAUSED");
    expect(mission).toBeDefined();

    const instructed = applyOperatorCommand(
      mission!,
      "instruction",
      { instruction: "Vérifie d'abord le viewport 375×667." },
      now + 1_000,
    );

    expect(getOperationalMission(instructed).status).toBe("running");
    expect(instructed.timeline.at(-1)?.detail).toBe("Vérifie d'abord le viewport 375×667.");
  });
});
