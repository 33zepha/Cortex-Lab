import { describe, it, expect } from "vitest";
import {
  formatMissionTitle,
  extractPrimaryIntent,
  cleanRawObjective,
  getMissionDisplay,
} from "../mission-naming";

describe("Mission Naming & Dynamic Natural Summarizer", () => {
  it("nettoie les préfixes de bruit usuels", () => {
    expect(cleanRawObjective("Objectif: Ajouter la pagination cursor-based")).toBe("Ajouter la pagination cursor-based");
    expect(cleanRawObjective("Ex : Corriger le bug OAuth")).toBe("Corriger le bug OAuth");
    expect(cleanRawObjective("/plan Implémenter le WebSocket")).toBe("Implémenter le WebSocket");
    expect(cleanRawObjective("## Tâche : Valider les schémas")).toBe("Valider les schémas");
  });

  it("extrait l'intention principale d'un texte multi-lignes ou multi-phrases", () => {
    const multiSentence = "Migrer le store vers SQLite. Tester les performances sous 1000 écritures. Documenter l'API.";
    expect(extractPrimaryIntent(multiSentence)).toBe("Migrer le store vers SQLite");

    const multiLine = "Corriger la régression sur iPhone.\n\nContraintes : Ne pas toucher aux routes API existantes.";
    expect(extractPrimaryIntent(multiLine)).toBe("Corriger la régression sur iPhone");
  });

  it("conserve intact un titre court sans le tronquer", () => {
    const shortObjective = "Ajouter la pagination cursor-based";
    expect(formatMissionTitle(shortObjective, { maxLength: 60 })).toBe("Ajouter la pagination cursor-based");
  });

  it("compacte à une frontière naturelle sans couper de mot en plein milieu", () => {
    const longObjective = "Ajouter la pagination cursor-based à GET /api/missions et migrer le store NDJSON sans casser la compatibilité";
    const compacted = formatMissionTitle(longObjective, { maxLength: 48 });

    // Ne doit pas couper au milieu de cursor-based ou missions
    expect(compacted).not.toMatch(/[a-zA-Z]-$/);
    expect(compacted).toBe("Ajouter la pagination cursor-based à GET");
  });

  it("génère une structure MissionDisplayInfo complète avec sous-titre contextualisé", () => {
    const mission = {
      objective: "Auditer l'architecture du projet Cortex, vérifier la conformité des flux SSE et mettre à jour la documentation NEXT.md",
    };

    const display = getMissionDisplay(mission, { maxLength: 45 });
    expect(display.title).toBeDefined();
    expect(display.isSummarized).toBe(true);
    expect(display.fullObjective).toBe(mission.objective);
  });

  it("respecte un titre explicite s'il est fourni", () => {
    const mission = {
      title: "Audit Architecture Cortex",
      objective: "Faire un audit approfondi de tous les composants du système.",
    };

    const display = getMissionDisplay(mission);
    expect(display.title).toBe("Audit Architecture Cortex");
  });
});
