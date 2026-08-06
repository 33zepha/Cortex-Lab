# STATUS

**Phase 1 ✓ COMPLETE** (design system) · `claude-sonnet-5`

## Existe

- 6 docs canoniques + typographie/navigation/thème light ajoutés à UI-SPEC.md.
- Projet Vite + React 18 + TS strict + Tailwind dans `/opt/cortex-v0.1-candidate`.
- **Thème light premium** (canvas #F6F7F9, accent #0077E6) — remplace le dark de la Phase 1 initiale.
- **Inter** auto-hébergée (1 fichier variable 400–600, `src/fonts/inter/`) — remplace Rubik.
- 22 primitives UI, shell `IconRail` (~64px) + `Sidecar` contextuel (~224px) à `laptop:`.
- 4 écrans : Overview (KPI row + graphique composé), Missions (vraie table, filtres 28px), Mission
  Detail (en-tête éditorial, inspecteur 340px), System (grille dense + sparkline).
- Fixtures TS réalistes, 6 missions, tous statuts + états loading/empty/SSE disconnected.
- Build + typecheck propres. 8 captures requises + 3 bonus dans `artifacts/ui/`.
- 4 commits sur `main` : design system, typo Rubik, rail+sidecar, reskin light+Inter.

## N'existe pas (attendu)

- Aucun backend réel, aucune API, aucune persistance : tout est fixture statique.
- Skill « Impeccable » (absente du compte) — substituée par auto-relecture en 2 passes.
- Aucun remote git, aucun push, dépôt GitHub `33zepha/Cortex-Lab` inchangé, aucune BDD.

## Décisions figées

1. TypeScript strict, React + Vite, Fastify + Zod, Radix + Tailwind.
2. Ledger append-only NDJSON, `seq` monotone, compatibilité **visée et testée**.
3. ULID, SSE (pas WebSocket), token sur mutations, SQLite évalué seulement si limites mesurées.
4. Inter (1 fichier variable) + Geist Mono — auto-hébergées.
5. Navigation = rail + sidecar contextuel piloté par l'URL, extensible.
6. Reskin = valeurs de tokens seulement, contrats de composants inchangés (voir DECISIONS #15).

## Prochaine phase

**Phase 2 — Runtime, contrats, ledger et sécurité** (voir NEXT.md).

---

**Contenu** : 6 docs canoniques + prototype CortexLab navigable (light, Inter), aucun backend.
