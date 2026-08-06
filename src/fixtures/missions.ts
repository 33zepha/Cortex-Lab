/**
 * FIXTURES DE PROTOTYPE — jamais de données de production.
 * Utilisées uniquement pour la Phase 1 (prototype statique navigable).
 */
import type { Mission } from "@/lib/types";

const now = Date.parse("2026-08-06T14:30:00Z");
const min = 60_000;

export const missionActive: Mission = {
  id: "01J8X3F7QK9V2M4N6P8R0T2W4Y",
  objective: "Ajouter la pagination cursor-based à GET /api/missions",
  constraints: "Ne pas casser les clients existants ; réponse rétrocompatible.",
  status: "running",
  step: "execution",
  model: "claude-code",
  progress: 62,
  createdAt: now - 14 * min,
  closedAt: null,
  durationMs: 14 * min,
  filesRead: [
    "src/routes/missions.ts",
    "src/repositories/mission-repository.ts",
    "src/schemas/mission.ts",
  ],
  filesModified: ["src/routes/missions.ts", "src/schemas/mission.ts"],
  tests: { status: "none", passed: 0, failed: 0, total: 0 },
  evidence: [
    {
      id: "ev-1",
      kind: "diff",
      title: "src/routes/missions.ts",
      content:
        "+  const cursor = request.query.cursor;\n+  const limit = Math.min(request.query.limit ?? 20, 100);\n+  const page = await repo.listSince(cursor, limit);",
      timestamp: now - 5 * min,
    },
  ],
  summary: undefined,
  error: null,
  decisionRequired: false,
  timeline: [
    { id: "t1", type: "plan", ts: now - 14 * min, title: "Plan formulé", detail: "3 étapes identifiées", children: ["Lire le schéma existant", "Ajouter le curseur", "Documenter la réponse"] },
    { id: "t2", type: "step", ts: now - 12 * min, title: "Étape 1 — lecture du schéma", detail: "Fichiers consultés : mission.ts, mission-repository.ts" },
    { id: "t3", type: "file_modified", ts: now - 6 * min, title: "src/routes/missions.ts modifié", detail: "+18 / −4 lignes", evidenceId: "ev-1" },
    { id: "t4", type: "step", ts: now - 3 * min, title: "Étape 2 — validation Zod du curseur", detail: "En cours" },
  ],
};

export const missionNeedsReview: Mission = {
  id: "01J8X3G2H4B6D8F0K2M4P6R8T0",
  objective: "Migrer le composant DatePicker legacy vers Radix Primitives",
  status: "needs_review",
  step: "closure",
  model: "claude-code",
  progress: 90,
  createdAt: now - 52 * min,
  closedAt: null,
  durationMs: 46 * min,
  filesRead: ["src/components/DatePicker.tsx", "src/components/legacy/Calendar.tsx"],
  filesModified: ["src/components/DatePicker.tsx", "src/components/legacy/Calendar.tsx"],
  tests: { status: "passing", passed: 11, failed: 0, total: 11 },
  evidence: [
    { id: "ev-2", kind: "test", title: "DatePicker.test.tsx", content: "✓ 11 passing (340ms)", timestamp: now - 40 * min },
    { id: "ev-3", kind: "diff", title: "src/components/legacy/Calendar.tsx", content: "-export function Calendar() { /* 240 lignes */ }\n+// Remplacé par Radix Popover + primitives/Calendar.tsx", timestamp: now - 38 * min },
  ],
  summary: "Migration terminée et testée. Le composant legacy Calendar.tsx est maintenant mort — décision humaine requise avant suppression.",
  error: null,
  decisionRequired: true,
  decisionPrompt: "Le fichier legacy/Calendar.tsx (240 lignes) n'est plus référencé nulle part. Le supprimer dans ce patch ?",
  timeline: [
    { id: "t1", type: "plan", ts: now - 52 * min, title: "Plan formulé", detail: "Migration en 3 étapes" },
    { id: "t2", type: "file_modified", ts: now - 44 * min, title: "src/components/DatePicker.tsx réécrit", detail: "Radix Popover + Calendar interne" },
    { id: "t3", type: "test", ts: now - 40 * min, title: "Tests exécutés", detail: "11/11 passants", evidenceId: "ev-2" },
    { id: "t4", type: "file_modified", ts: now - 38 * min, title: "legacy/Calendar.tsx marqué obsolète", evidenceId: "ev-3" },
    { id: "t5", type: "decision", ts: now - 6 * min, title: "Décision humaine requise", detail: "Supprimer le fichier legacy ?" },
  ],
};

export const missionCompleted1: Mission = {
  id: "01J8X2D4F6H8K0M2P4R6T8V0X2",
  objective: "Corriger le bug d'expiration prématurée du token OAuth",
  status: "completed",
  step: "closure",
  model: "claude-code",
  progress: 100,
  createdAt: now - 3 * 60 * min,
  closedAt: now - 2 * 60 * min - 41 * min,
  durationMs: 19 * min,
  filesRead: ["src/auth/oauth.ts", "src/auth/token-store.ts"],
  filesModified: ["src/auth/oauth.ts"],
  tests: { status: "passing", passed: 6, failed: 0, total: 6 },
  evidence: [
    { id: "ev-4", kind: "diff", title: "src/auth/oauth.ts", content: "-  const ttl = 3600;\n+  const ttl = payload.expires_in ?? 3600;", timestamp: now - 3 * 60 * min + 15 * min },
    { id: "ev-5", kind: "test", title: "oauth.test.ts", content: "✓ 6 passing (120ms)", timestamp: now - 3 * 60 * min + 18 * min },
  ],
  patch: "--- a/src/auth/oauth.ts\n+++ b/src/auth/oauth.ts\n@@ -42,7 +42,7 @@\n-  const ttl = 3600;\n+  const ttl = payload.expires_in ?? 3600;",
  summary: "Le TTL était codé en dur à 3600s au lieu de lire expires_in renvoyé par le provider. Corrigé et testé.",
  error: null,
  decisionRequired: false,
  timeline: [
    { id: "t1", type: "plan", ts: now - 3 * 60 * min, title: "Plan formulé" },
    { id: "t2", type: "file_modified", ts: now - 3 * 60 * min + 15 * min, title: "src/auth/oauth.ts modifié", evidenceId: "ev-4" },
    { id: "t3", type: "test", ts: now - 3 * 60 * min + 18 * min, title: "Tests exécutés", detail: "6/6 passants", evidenceId: "ev-5" },
    { id: "t4", type: "closure", ts: now - 2 * 60 * min - 41 * min, title: "Mission clôturée", detail: "Résultat : succès" },
  ],
};

export const missionFailed: Mission = {
  id: "01J8X1B2C4E6G8J0L2N4Q6S8U0",
  objective: "Ajouter le support WebSocket au SSE Projection",
  status: "failed",
  step: "execution",
  model: "claude-code",
  progress: 34,
  createdAt: now - 5 * 60 * min,
  closedAt: now - 4 * 60 * min - 48 * min,
  durationMs: 12 * min,
  filesRead: ["src/sse/projection.ts"],
  filesModified: [],
  tests: { status: "none", passed: 0, failed: 0, total: 0 },
  evidence: [
    { id: "ev-6", kind: "log", title: "runner.log", content: "Error: budget de temps de la mission dépassé (10min).\nAucun fallback silencieux — mission arrêtée.", timestamp: now - 4 * 60 * min - 48 * min },
  ],
  summary: undefined,
  error: "Budget temps dépassé après 10 minutes sans progression mesurable. Mission arrêtée conformément à la politique (aucun fallback silencieux).",
  decisionRequired: false,
  timeline: [
    { id: "t1", type: "plan", ts: now - 5 * 60 * min, title: "Plan formulé" },
    { id: "t2", type: "step", ts: now - 5 * 60 * min + 3 * min, title: "Étape 1 — analyse de l'architecture SSE existante" },
    { id: "t3", type: "error", ts: now - 4 * 60 * min - 48 * min, title: "Mission échouée", detail: "Budget temps dépassé", evidenceId: "ev-6" },
  ],
};

export const missionCancelled: Mission = {
  id: "01J8X0A1B2C3D4E5F6G7H8J9K0",
  objective: "Générer les tests manquants pour MissionRepository",
  status: "cancelled",
  step: "execution",
  model: "claude-code",
  progress: 21,
  createdAt: now - 8 * 60 * min,
  closedAt: now - 7 * 60 * min - 51 * min,
  durationMs: 9 * min,
  filesRead: ["src/repositories/mission-repository.ts"],
  filesModified: [],
  tests: { status: "none", passed: 0, failed: 0, total: 0 },
  evidence: [],
  summary: undefined,
  error: null,
  decisionRequired: false,
  timeline: [
    { id: "t1", type: "plan", ts: now - 8 * 60 * min, title: "Plan formulé" },
    { id: "t2", type: "step", ts: now - 8 * 60 * min + 2 * min, title: "Étape 1 — lecture du repository" },
    { id: "t3", type: "closure", ts: now - 7 * 60 * min - 51 * min, title: "Mission annulée", detail: "Annulée manuellement depuis CortexLab" },
  ],
};

export const missionCompleted2: Mission = {
  id: "01J8W9Z8Y7X6W5V4U3T2S1R0Q9",
  objective: "Nettoyer les dépendances npm obsolètes du monorepo",
  status: "completed",
  step: "closure",
  model: "claude-code",
  progress: 100,
  createdAt: now - 26 * 60 * min,
  closedAt: now - 25 * 60 * min - 12 * min,
  durationMs: 48 * min,
  filesRead: ["package.json", "package-lock.json"],
  filesModified: ["package.json"],
  tests: { status: "passing", passed: 42, failed: 0, total: 42 },
  evidence: [
    { id: "ev-7", kind: "diff", title: "package.json", content: "-  \"moment\": \"^2.29.0\",\n-  \"request\": \"^2.88.0\",", timestamp: now - 26 * 60 * min + 30 * min },
  ],
  patch: "--- a/package.json\n+++ b/package.json\n@@ removed 2 deprecated packages",
  summary: "7 dépendances obsolètes retirées (moment, request, ...). Suite de tests inchangée, tout passe.",
  error: null,
  decisionRequired: false,
  timeline: [
    { id: "t1", type: "plan", ts: now - 26 * 60 * min, title: "Plan formulé" },
    { id: "t2", type: "file_modified", ts: now - 26 * 60 * min + 30 * min, title: "package.json modifié", evidenceId: "ev-7" },
    { id: "t3", type: "test", ts: now - 25 * 60 * min + 40 * min, title: "Suite complète exécutée", detail: "42/42 passants" },
    { id: "t4", type: "closure", ts: now - 25 * 60 * min - 12 * min, title: "Mission clôturée" },
  ],
};

export const allMissions: Mission[] = [
  missionActive,
  missionNeedsReview,
  missionCompleted1,
  missionFailed,
  missionCancelled,
  missionCompleted2,
];

export const emptyMissions: Mission[] = [];

export function findMission(id: string): Mission | undefined {
  return allMissions.find((m) => m.id === id);
}
