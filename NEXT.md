# NEXT

**Phase suivante — Mission Graph + Worker Runtime**

## Objectif

Faire évoluer Cortex d'un runner séquentiel mono-adapter vers un runtime capable d'exécuter un graphe de tâches explicite, observable et évaluable, sans introduire prématurément une armée d'agents.

## À construire

1. **MissionPlan v2 typé**
   - `tasks[]` avec id, objective, acceptance criteria, dependencies, risk et preferred capabilities.
   - validation Zod et version explicite.

2. **Worker Runtime**
   - exécuter une tâche isolée indépendamment du Planner.
   - état `queued/running/completed/failed/cancelled`.
   - retries bornés et idempotence documentée.

3. **Model registry minimal**
   - conserver Claude Code.
   - ajouter les prochains adapters seulement derrière `ModelAdapter`.
   - routage par capability, pas par nom d'agent décoratif.

4. **Evaluator loop**
   - acceptance criteria machine-readable quand possible.
   - tests/evidence avant fermeture.
   - réessai ou revue humaine si score insuffisant.

5. **Tool Gateway**
   - déplacer progressivement filesystem/shell/git derrière Cortex Policy.
   - enregistrer les tool calls importants dans le ledger.

6. **Realtime UI v2**
   - timeline d'exécution issue du ledger.
   - tâches, workers, preuves, décisions et erreurs visibles sans pseudo-KPI.

## Ne pas faire encore

- Pas de 15 agents nommés sans responsabilité exécutable.
- Pas de Kubernetes/Kafka/Temporal tant que les limites mono-process ne sont pas mesurées.
- Pas de migration PostgreSQL par principe.
- Pas de mémoire long terme avant d'avoir défini ce qui mérite réellement d'être mémorisé.

## Critères de sortie

- Une mission complexe produit un MissionPlan v2 validé.
- Chaque tâche du plan possède une trace d'exécution et des evidences.
- L'annulation coupe réellement le worker concerné.
- La Policy encadre les opérations sensibles.
- La mission ne peut être `completed` sans critères de sortie vérifiés.
- Le frontend affiche le graphe et son activité depuis le stream d'événements.
