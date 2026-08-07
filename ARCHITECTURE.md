# ARCHITECTURE

## Vue d'ensemble

Cortex est un runtime événementiel pour missions agentiques. Le frontend n'est jamais la source de vérité : il projette l'état produit par le ledger.

```text
Browser / Hermes
      |
      v
 Fastify API
      |
      +--> Mission Service / Runner
      |        |
      |        +--> Planner
      |        +--> Policy
      |        +--> Workspace Manager
      |        +--> ModelAdapter (Claude Code)
      |
      +--> Event Store (NDJSON append-only)
      +--> Mission Repository (projection JSON)
      +--> Evidence Store
      |
      +--> SSE /api/stream
               |
               v
          CortexLab UI
```

## Frontières

| Module | Responsabilité |
|---|---|
| Mission API | Fastify, validation, auth token, routes HTTP/SSE |
| Runner | cycle de mission et exécution séquentielle des étapes planifiées |
| Planner | transforme objectif/contraintes en étapes ; MissionPlan v2 typé est la prochaine évolution |
| ModelAdapter | contrat des moteurs d'exécution ; Claude Code est l'implémentation réelle actuelle |
| Policy | budget tokens, timeout et autorisation des chemins produits |
| Workspace Manager | copie isolée du projet source + baseline git + diff final |
| Event Store | journal append-only, `seq` monotone par mission |
| Mission Repository | projection persistée reconstruisible depuis le ledger |
| Evidence Store | diffs, logs, tests, artifacts avec redaction |
| SSE Projection | projection temps réel du ledger vers les clients |
| CortexLab | React/Vite, lecture API + invalidation SWR par SSE |

## Cycle d'une mission actuel

```text
POST /api/missions
  -> mission.created
  -> projection persistée status=running
  -> Planner.plan()
  -> plan.ready { steps[] }
  -> workspace isolé
  -> pour chaque step:
       step.started
       Policy: budget + timeout
       ModelAdapter.execute(step, previousContext)
       Policy: validation fichiers modifiés
       file.modified*
       projection persistée
  -> evidence diff
  -> evidence.recorded
  -> mission.closed
```

Le plan n'est donc plus seulement informatif : chaque étape est réellement transmise au ModelAdapter et reçoit le contexte des étapes précédentes.

## Cancellation et timeout

Le serveur alloue le `missionId` avant de lancer le Runner et associe immédiatement un `AbortController` à la mission active.

```text
POST /api/missions/:id/cancel
  -> AbortController.abort()
  -> Runner
  -> child AbortSignal de l'étape
  -> ClaudeCodeAdapter
  -> SshClient.dispose()
  -> mission.cancelled
```

Chaque étape possède également un timeout Policy. Le timeout déclenche l'abort de l'adapter, pas seulement un rejet logique côté HTTP.

## Policy

La Policy est consultée dans le chemin d'exécution réel.

- budget token global par mission ;
- timeout par étape ;
- validation des chemins modifiés ;
- denylist minimale par défaut : `.env`, `.git/`, `node_modules/`, `dist/`, `.cortex/`.

Limite actuelle : les tool calls internes de Claude Code ne passent pas encore tous par un Tool Gateway Cortex. La prochaine architecture devra déplacer filesystem/shell/git derrière une frontière outillée contrôlée par Policy.

## Event model

Chaque événement porte :

```ts
type DomainEvent = {
  id: string;
  missionId: string;
  seq: number;      // monotone dans la mission
  type: string;
  v: string;
  ts: number;
  actor: string;
  payload: Record<string, unknown>;
};
```

Événements principaux :

```text
mission.created
plan.ready
step.started
file.read
file.modified
test.completed
evidence.recorded
decision.requested
decision.provided
mission.cancelled
mission.closed
```

## Realtime

Deux routes exposent le ledger :

```text
GET /api/events?cursor=<offset>&limit=<n>
GET /api/stream?cursor=<offset>
```

Le curseur global SSE est actuellement un offset du ledger, car `seq` est volontairement monotone **par mission** et ne peut donc pas servir de curseur global non ambigu.

Le frontend écoute le stream avec `EventSource` et invalide les ressources SWR concernées. Un polling de 15 s reste un filet de sécurité, pas le mécanisme temps réel principal.

## Persistence

```text
data/
├── workspaces/<mission-id>/   # temporaire
├── evidence/<mission-id>/
├── missions/<mission-id>.json
└── ledger/events.ndjson
```

Le ledger est la source de vérité métier. Le fichier mission est une projection reconstruisible.

Le store actuel sérialise les writes dans le process Node. Cette architecture suppose donc **un seul Cortex Core writer**. Le scale horizontal nécessitera un mécanisme de lock/store partagé, mais aucune migration n'est déclenchée avant mesure réelle du besoin.

## Déploiement

Production recommandée :

```text
Browser
  -> cortexlab.online/api/*
  -> Vercel proxy server-side
  -> CORTEX_API_ORIGIN
  -> Cloudflare Tunnel
  -> Fastify 127.0.0.1:4000
```

La rewrite Vercel transmet explicitement `:path*` au proxy. Le navigateur ne reçoit jamais `CORTEX_API_TOKEN`.

Variables principales :

```text
API_HOST=127.0.0.1
API_PORT=4000
CORTEX_API_TOKEN=...
CORTEX_TOKEN_BUDGET=120000
CORTEX_STEP_TIMEOUT_SECONDS=1800
CORTEX_API_ORIGIN=https://api.cortexlab.online
```

## API actuelle

```text
POST /api/missions
GET  /api/missions
GET  /api/missions/:id
POST /api/missions/:id/cancel
POST /api/missions/:id/decision
GET  /api/missions/:id/evidence   # contrat prévu ; vérifier avant dépendance externe
GET  /api/tokens/weekly
GET  /api/events
GET  /api/stream
GET  /api/health
```

## Invariants

1. Aucun fallback silencieux de modèle.
2. Une mission ne modifie jamais directement le projet source.
3. Toute mutation métier importante produit un événement.
4. La projection doit rester reconstruisible depuis le ledger.
5. Les secrets ne transitent pas dans le browser bundle.
6. Le multi-agent ne sera ajouté qu'au-dessus d'un Worker Runtime typé et observable.

## Prochaine frontière

Voir `NEXT.md` : MissionPlan v2 typé, Worker Runtime, evaluator loop et Tool Gateway. Le but n'est pas d'ajouter des personas d'agents mais de rendre chaque unité de travail exécutable, gouvernable et prouvable.
