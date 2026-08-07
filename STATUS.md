# STATUS

**Runtime v0.2 — en cours de stabilisation**

## Réalité actuelle

Cortex-Lab n'est plus un prototype statique. Le dépôt contient un frontend React/Vite réel, une API Fastify, un ledger NDJSON append-only, des projections de missions, un Evidence Store, des workspaces isolés et un ModelAdapter Claude Code exécuté via SSH sur le VPS.

### Fonctionnel

- Frontend : Overview, Missions, Mission Detail, System, Profile.
- API : health, missions, détail, création, annulation, décisions, tokens hebdomadaires, événements, stream SSE.
- Persistence : `data/ledger/events.ndjson`, missions JSON et evidence par mission.
- Runner : le plan du Planner est exécuté étape par étape ; le résultat d'une étape alimente le contexte de la suivante.
- Exécution réelle : Claude Code sur VPS via SSH, workspace distant temporaire puis synchronisation retour.
- Isolation : copie du projet source, baseline git locale, sortie sous forme de diff ; le projet source n'est pas modifié directement.
- Policy : budget tokens, timeout par étape, contrôle post-exécution des chemins modifiés et denylist sensible (`.env`, `.git`, `node_modules`, etc.).
- Cancellation : `AbortController` runtime propagé jusqu'à l'exécution SSH.
- Realtime : `/api/stream` projette le ledger en SSE ; le frontend invalide SWR à réception des événements et garde un polling lent comme filet de sécurité.
- API prod : Vercel relaie `/api/:path*` vers le proxy en conservant explicitement le chemin demandé.
- Sécurité prod : Fastify écoute `127.0.0.1` par défaut ; le proxy Vercel injecte `CORTEX_API_TOKEN` côté serveur.

## Validation en cours

- Le build Vercel du commit `5163eb7` est connu comme obsolète : il précédait l'injection de `policy` dans `backend/scripts/run-real-mission.ts`.
- Le head courant doit être validé par un nouveau preview Vercel avant merge.

## Limites connues

- Un seul ModelAdapter réel : Claude Code.
- Le Planner reste `string[]` ; il n'existe pas encore de graphe de tâches typé avec dépendances/capabilities.
- La Policy ne contrôle pas encore chaque tool-call interne de Claude Code : elle encadre le runtime et valide les fichiers produits, mais un vrai Tool Gateway reste à construire.
- Le ledger est mono-process : la sérialisation des writes est en mémoire. Pas de scale horizontal tant qu'un stockage/lock partagé n'est pas introduit.
- SSE lit périodiquement le ledger ; une projection push native pourra remplacer ce mécanisme quand la charge le justifiera.
- Pas encore de multi-agent, manager hierarchy, evaluator loop ou mémoire cross-mission.

## Invariants à préserver

1. Ledger append-only comme source de vérité métier.
2. Projection reconstruisible depuis les événements.
3. Aucun fallback silencieux de modèle ou de données en production.
4. Une mission ne modifie jamais directement le projet source.
5. Secrets absents du navigateur et redactés des evidences.
6. Les docs `STATUS.md`, `NEXT.md` et `ARCHITECTURE.md` doivent décrire le code réellement déployable.

## Prochaine étape

Voir `NEXT.md` : passer du runner séquentiel mono-adapter à un **Mission Graph typé + Worker Runtime**, sans encore multiplier artificiellement les agents.
