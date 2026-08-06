# ARCHITECTURE

## Frontières du noyau

Cortex est composé de ces modules (dépendances orientées vers le domaine, aucun cycle) :

| Module | Responsabilité |
|--------|---|
| **Mission API** | Fastify server, routes HTTP, validation Zod, authentification par token |
| **Mission Service** | Logique métier, création et gestion du cycle de mission |
| **Planner** | Formulation du plan structuré à partir de l'objectif |
| **Runner** | Exécution du plan, coordination avec le ModelAdapter, gestion des étapes |
| **Model Adapter** | Interface vers les moteurs d'exécution (Claude Code en v0.1) |
| **Workspace Manager** | Gestion des copies de travail isolées par mission |
| **Event Store** | Persistence append-only du journal d'événements |
| **Mission Repository** | Accès aux données de mission (métadonnées, état) |
| **Evidence Store** | Stockage des preuves (diffs, outputs, artifacts) |
| **Policy** | Règles de sécurité et limites par mission |
| **SSE Projection** | Projection du journal en événements temps réel pour les clients |
| **CortexLab** | Interface utilisateur (React + Vite) |

## Flux de données

```
Hermes
  ↓ POST /api/missions {objective, constraints}
  ↓
Mission API (validation Zod)
  ↓ créate mission.created
  ↓
Mission Service (enregistre l'événement)
  ↓ lit mission.created
  ↓
Planner (formule plan versionné)
  ↓ émet plan.ready
  ↓
Runner (reçoit plan.ready)
  ↓
Workspace Manager (copie isolée)
  ↓
Model Adapter → Claude Code
  ↓
fichiers modifiés, tests, logs
  ↓ émet step.started, file.modified, test.completed, evidence.recorded
  ↓
Evidence Store (diffs, outputs, artefacts)
  ↓ émet decision.requested (si nécessaire) ou mission.closed
  ↓
SSE Projection (projette la séquence d'événements pour CortexLab)
  ↓
CortexLab + Hermes (lisent via GET /api/stream avec curseur seq)
```

## Contrats versionnés

Chaque contrat porte une version explicite. Une implémentation en v0.1 ; les futures pourront s'ajouter sans casser celle-ci.

### ModelAdapter

```typescript
interface ModelAdapter {
  version: "1.0.0";
  execute(task: RunnerTask, workspace: Workspace): Promise<ModelResult>;
  estimateTokens(task: RunnerTask): number;
  health(): Promise<{ available: boolean; rateLimit?: number }>;
}

type RunnerTask = {
  missionId: string;
  step: string;
  objective: string;
  context: string;
  constraints: string;
  workspace: {
    root: string;
    readOnly: string[];
    gitRepo?: boolean;
  };
};

type ModelResult = {
  success: boolean;
  output: string;
  filesModified: string[];
  filesRead: string[];
  error?: string;
  metadata: { tokensUsed: number; duration: number };
};
```

### EventStore & MissionRepository

Accès **uniquement** derrière ces interfaces ; implémentation fichier JSONL en v0.1.

```typescript
interface EventStore {
  version: "1.0.0";
  append(event: DomainEvent): Promise<{ seq: number }>;
  readSince(missionId: string, fromSeq: number): AsyncIterable<DomainEvent>;
  readAll(missionId: string): Promise<DomainEvent[]>;
}

interface MissionRepository {
  version: "1.0.0";
  create(mission: MissionEntity): Promise<void>;
  findById(id: string): Promise<MissionEntity | null>;
  update(mission: MissionEntity): Promise<void>;
}
```

### EvidenceStore

```typescript
interface EvidenceStore {
  version: "1.0.0";
  record(missionId: string, type: string, content: any): Promise<void>;
  list(missionId: string): Promise<Evidence[]>;
}

type Evidence = {
  id: string; // ULID
  type: "test" | "diff" | "artifact" | "log";
  content: string;
  timestamp: number;
};
```

### Policy

```typescript
interface Policy {
  version: "1.0.0";
  authorize(action: PolicyAction): boolean;
  tokenBudgetFor(missionId: string): number;
  timeoutSecondsFor(missionId: string): number;
}

type PolicyAction = {
  actor: "mission" | "api";
  action: "read_file" | "write_file" | "execute_command";
  target: string;
  missionId: string;
};
```

## Modèle d'événements

Enveloppe stable pour tous les événements :

```typescript
type DomainEvent = {
  id: string; // ULID, unique
  missionId: string;
  seq: number; // monotone par mission
  type: EventType;
  v: string; // version du schéma de l'événement
  ts: number; // Unix timestamp
  actor: string; // "api" | "runner" | "policy" | "system"
  payload: Record<string, any>;
};

type EventType =
  | "mission.created"
  | "plan.ready"
  | "step.started"
  | "file.read"
  | "file.modified"
  | "test.completed"
  | "evidence.recorded"
  | "decision.requested"
  | "decision.provided"
  | "mission.cancelled"
  | "mission.closed";
```

Avantages : `seq` monotone = base du rejeu, de la reprise et du curseur SSE ; version explicite = compatibilité ascendante **visée et testée** (pas un acquis automatique : chaque nouvelle version d'événement est vérifiée contre les précédentes).

## Disposition des données

Exactement celle du brief :

```
data/
├── workspaces/
│   └── <mission-id>/                   # copie isolée par mission
│       ├── .git/
│       ├── <user files>
│       └── .cortex/
│           └── patch.diff              # diff de sortie
├── evidence/
│   └── <mission-id>/
│       ├── tests-<step>.json
│       ├── diff-<step>.txt
│       └── artifacts/
├── missions/
│   └── <mission-id>.json               # métadonnées de mission
└── ledger/
    └── events.ndjson                   # append-only journal
```

Accès **uniquement** via `MissionRepository`, `EventStore`, `EvidenceStore`. Aucune migration SQLite ou PostgreSQL n'est programmée à une phase prédéterminée : un backend différent ne sera évalué que si les limites du JSONL sont mesurées en usage réel (taille de fichier, latence de lecture, écriture concurrente) — et sans modification du domaine, quel que soit le backend retenu.

## Identifiants

Tous les identifiants sont des **ULID** :

- Triables dans le temps.
- Générables sans coordination côté client.
- Compatibles workers distants futurs.
- Lisibles en base de données.

## Isolation et sécurité

- Chaque mission a un workspace dédié (copie isolée du projet source).
- La mission **ne modifie jamais** le projet source ; elle produit un **patch** (fichier diff).
- Git worktree n'est **jamais** persisté.
- `Policy` décide des chemins et commandes autorisés.
- Secrets redactés à l'écriture du ledger.
- Token requis sur les mutations de l'API.
- Budget temps/tokens par mission, appliqué par `Policy`.
- Annulation propre : une mission interrompue est marquée échouée ; pas de nettoyage partiel.
- **Aucun fallback silencieux** : si Claude Code est indisponible, la mission échoue explicitement.

## API minimale pour Hermes

Huit routes :

```
POST   /api/missions                   # créer une mission
GET    /api/missions                   # lister les missions
GET    /api/missions/:id               # détails d'une mission
POST   /api/missions/:id/cancel        # annuler une mission
GET    /api/missions/:id/evidence      # récupérer les preuves
GET    /api/events                     # historique des événements
GET    /api/stream                     # SSE : stream d'événements (cursor ?seq=<n>)
GET    /api/health                     # santé du système
```

Réponse pour une mission (`GET /api/missions/:id`) :

```json
{
  "id": "...",
  "status": "running|completed|failed|cancelled",
  "objective": "...",
  "constraints": "...",
  "step": "execution",
  "model": "claude-code",
  "summary": "...",
  "filesModified": ["path/to/file.ts"],
  "testsStatus": "passing|failing|none",
  "evidence": [...],
  "patch": "diff content",
  "error": null,
  "decisionRequired": false,
  "decisionPrompt": null,
  "createdAt": 1722965400000,
  "closedAt": null
}
```

## Croissance 100×

L'architecture permet sans réécriture :

- **Concurrence** : verrou par mission (jamais global), `seq` monotone local.
- **Distribuée** : Runner extrait de Fastify, workers distants appelés via `ModelAdapter`.
- **Stockage** : SQLite puis PostgreSQL restent des options derrière les interfaces existantes, évaluées uniquement si les limites mesurées du JSONL l'exigent — jamais une migration automatique à une phase prédéterminée.
- **Nouveaux modèles** : nouvelle implémentation de `ModelAdapter`.
- **File d'attente** : interface `MissionQueue` (déclarée, non écrite).
- **Missions async** : contrats n'y changent rien.
- **Mémoire** : champ optionnel `context` extensible.
- **Nouveaux outils** : `ToolAdapter` (interface prévue, une implémentation en v0.1).
- **Frontière API/frontend** : séparation par SSE déjà établie.

## Reporté explicitement

- Plugin system.
- Registry massif de modèles ou d'outils.
- Multi-tenant, authentification multi-utilisateurs.
- Mémoire long terme ou cross-mission.
- Orchestration multi-agents.
- Télémétrie distribuée.
- Rollback automatique de missions échouées.
