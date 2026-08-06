# NEXT

**Phase 2 — Runtime, contrats, ledger et sécurité**

Model: `claude-sonnet-5` | Effort: `high`

## Objectif

Construire le noyau exécutable de Cortex : les contrats TypeScript/Zod versionnés, l'Event Store (NDJSON
append-only), le Mission Repository, l'Evidence Store et la Policy — sans encore brancher Claude Code ni
l'API HTTP. Ce lot doit prouver que le domaine fonctionne et se teste indépendamment de Fastify et du
frontend.

## Livrables

1. **Contrats versionnés** (`packages/core/contracts/` ou équivalent) : `ModelAdapter`, `ToolAdapter`,
   `MissionRepository`, `EventStore`, `EvidenceStore`, `Policy` — interfaces TypeScript + schémas Zod pour
   chaque événement (`mission.created`, `plan.ready`, `step.started`, `file.read`, `file.modified`,
   `test.completed`, `evidence.recorded`, `decision.requested`, `decision.provided`, `mission.cancelled`,
   `mission.closed`), avec `v` explicite sur chacun.
2. **EventStore** : implémentation fichier NDJSON append-only (`data/ledger/events.ndjson`), `append()`,
   `readSince(missionId, seq)`, `readAll(missionId)`. Écriture atomique (pas de corruption si interruption).
3. **MissionRepository** : implémentation fichier JSON (`data/missions/<id>.json`), projection de l'état
   de mission à partir du ledger (pas de double source de vérité).
4. **EvidenceStore** : implémentation fichier (`data/evidence/<id>/`), redaction des secrets à l'écriture.
5. **Policy** : budget temps/tokens par mission, autorisation de chemins/commandes — implémentation simple
   mais réellement appliquée (pas un stub qui retourne toujours `true`).
6. **Fake ModelAdapter** : implémentation déterministe pour les tests uniquement (jamais utilisée en
   production), conforme à `ModelAdapter` v1.0.0.
7. **Tests** (Vitest ou `node:test`) : cycle de vie complet d'une mission simulée (create → plan → steps →
   evidence → close) via le fake adapter, rejeu du ledger, vérification `seq` monotone.

## Périmètre exact

**Inclus** : domaine + contrats + stores fichier + tests. Aucune dépendance vers Fastify, React ou Claude
Code réel.

**Exclu** : API HTTP (Phase 3), Runner réel branché sur Claude Code (Phase 3), SSE (Phase 4), intégration
CortexLab (Phase 5).

## Critères de sortie

- [ ] Tous les contrats du brief présents, versionnés, validés par Zod.
- [ ] `npm test` passe : cycle de mission complet simulé avec le fake adapter.
- [ ] Écriture ledger append-only vérifiée résistante à une interruption simulée.
- [ ] Aucune dépendance circulaire (domaine n'importe ni Fastify ni React).
- [ ] `STATUS.md` et `NEXT.md` mis à jour, commit unique sur `main`.

## Hors périmètre

- Aucune route HTTP réelle, aucun appel à Claude Code, aucune UI branchée sur ces données.
- Aucune migration SQLite : JSONL reste le stockage tant que ses limites ne sont pas mesurées en usage réel.

---

**Arrête-toi après validation des tests. Pas de Phase 3 sans confirmation.**
