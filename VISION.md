# VISION

## Hermes

Hermes est l'agent personnel généraliste. Il est la **seule surface de conversation** : il reçoit la
demande, la reformule en objectif et en contraintes, appelle Cortex quand la demande exige un travail
technique réel, puis restitue le résultat en langage naturel. Hermes ne planifie pas l'exécution et ne
touche jamais aux fichiers lui-même.

## Cortex

Cortex est le **moteur de missions structurées**. Il ne parle jamais à l'utilisateur final : il exécute et
il prouve. Une mission est un objet durable qui porte un objectif, un plan, une exécution, des preuves et
un verdict. Tout ce que Cortex fait est écrit dans un journal d'événements append-only ; l'état d'une
mission est toujours une projection de ce journal, jamais une opinion.

## Expérience cible

Un objectif en langage naturel donne un **résultat vérifiable accompagné de ses preuves** : ce qui a été
lu, ce qui a été modifié, ce qui a été testé, ce qui reste incertain. Jamais un mur de logs, jamais une
affirmation sans trace. Quand Cortex ne peut pas conclure seul, il demande explicitement une décision
humaine plutôt que de deviner.

## Boucle d'une mission

```
Utilisateur → Hermes → Cortex → Claude Code
           → modifications + tests + preuves
           → Cortex → Hermes → Utilisateur
```

Détail interne : `objectif → plan → exécution → modifications → tests → preuves → closure → restitution`.

## Ambition long terme

Cortex doit pouvoir accueillir, sans réécriture du cœur : plusieurs modèles, plusieurs agents et managers,
des workers distants, des missions parallèles, une file d'attente, SQLite puis PostgreSQL, davantage
d'outils, une mémoire de mission plus riche, des politiques de gouvernance, d'autres interfaces et une
architecture distribuée.

Aucune de ces fonctions n'est construite en v0.1. Seules leurs **frontières** existent : des contrats
versionnés, des identifiants stables, des événements compatibles ascendants et des modules sans
dépendance circulaire.

## Limites conscientes de la v0.1

- Claude Code est le **seul moteur de production**. Pas de second modèle, pas de fallback silencieux.
- Un seul processus, un seul utilisateur, un seul poste de travail. Pas d'authentification multi-comptes.
- Missions **séquentielles** : la concurrence est rendue possible par l'architecture, pas activée.
- Ledger et preuves en fichiers JSONL. Pas encore de base de données.
- Une mission travaille dans une **copie isolée** et produit un **patch** ; elle ne modifie jamais
  automatiquement le projet source.
- Mémoire limitée à la mission courante. Pas de mémoire transverse entre missions.
- Reprise après crash limitée au rejeu du journal : une mission interrompue est marquée échouée, pas
  reprise en cours de route.
