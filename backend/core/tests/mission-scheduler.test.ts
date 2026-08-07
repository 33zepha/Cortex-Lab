import { describe, expect, it } from "vitest";
import { MissionScheduler } from "../scheduler/mission-scheduler";
import type { MissionPlan } from "../contracts/mission-plan";

function task(id: string, dependencies: string[] = []): MissionPlan["tasks"][number] {
  return {
    id,
    objective: id,
    acceptanceCriteria: [`${id} done`],
    dependencies,
    risk: "low",
    preferredCapabilities: [],
  };
}

describe("MissionScheduler", () => {
  it("rend disponibles uniquement les tâches dont les dépendances sont terminées", () => {
    const scheduler = new MissionScheduler({
      version: "2.0.0",
      tasks: [task("inspect"), task("research"), task("implement", ["inspect"]), task("verify", ["implement", "research"])],
    });

    expect(scheduler.nextReady()?.id).toBe("inspect");
    scheduler.markRunning("inspect");
    scheduler.markCompleted("inspect");

    expect(scheduler.nextReady()?.id).toBe("research");
    scheduler.markRunning("research");
    scheduler.markCompleted("research");

    expect(scheduler.nextReady()?.id).toBe("implement");
    scheduler.markRunning("implement");
    scheduler.markCompleted("implement");

    expect(scheduler.nextReady()?.id).toBe("verify");
    scheduler.markRunning("verify");
    scheduler.markCompleted("verify");

    expect(scheduler.isComplete()).toBe(true);
  });

  it("refuse une transition d'état invalide", () => {
    const scheduler = new MissionScheduler({ version: "2.0.0", tasks: [task("inspect")] });
    expect(() => scheduler.markCompleted("inspect")).toThrow("Transition invalide");
  });

  it("annule les tâches encore en file", () => {
    const scheduler = new MissionScheduler({ version: "2.0.0", tasks: [task("a"), task("b", ["a"])] });
    scheduler.markRunning("a");
    scheduler.markCancelled("a");
    scheduler.cancelQueued();

    expect(scheduler.snapshot().map((entry) => entry.state)).toEqual(["cancelled", "cancelled"]);
  });
});
