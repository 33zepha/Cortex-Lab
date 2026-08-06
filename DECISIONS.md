# DECISIONS

Décisions structurantes irréversibles ou fondatrices.

## 1. TypeScript strict de bout en bout

**Décision** : Noyau et UI en TypeScript strict, React + Vite (pas de Next.js).

**Justification** : Cortex est un cockpit applicatif, pas un site SEO. Une seule langue, une cohérence runtime/types. Le SDK Claude Code est natif TypeScript.

**Conséquence** : Fastify + Zod pour l'API. Contrats validés à la frontière. Tout est typé ; aucune `any`. DevX amélioré, erreurs détectées tôt.

## 2. Fastify + Zod

**Décision** : API Fastify (léger, fast), schémas Zod pour les contrats et validation.

**Justification** : Fastify startup temps < 100 ms, footprint minimal. Zod alignes runtime et TypeScript. Aucune dépendance vers les ORM.

**Conséquence** : Contrats versionnés Zod. Validation stricte à la frontière (API). Extensible sans régression.

## 3. Ledger append-only comme source de vérité

**Décision** : `data/ledger/events.ndjson` est la source de vérité. État de mission = projection du ledger.

**Justification** : Rejeu exact, auditable, testable. Pas d'état perdu. Passage futur à DB sans réécriture.

**Conséquence** : Événements versionnés. Aucune suppression ni modification directe de fichier. Reprise après crash via rejeu.

## 4. Enveloppe d'événement versionnée + seq monotone

**Décision** : `{ id, missionId, seq, type, v, ts, actor, payload }`. `seq` monotone par mission.

**Justification** : `seq` est le curseur pour SSE, rejeu et reprise. Version explicite = compatibilité ascendante **visée et testée**, pas garantie par construction. Événements immuables.

**Conséquence** : Aucune modification d'événement postérieur. Champ optionnel dans `payload` = compatible ascendant. Retrait ou renommage = nouvelle version de type d'événement.

## 5. ULID pour tous les identifiants

**Décision** : Missions, événements, preuves = ULID (`ulid()` NPM).

**Justification** : Triables, générables côté client, pas de coordination. Compatibles sharding futur, workers distants. Lisibles dans les logs.

**Conséquence** : Pas d'autoincrement. Dépendance `ulid` v2+. Aucun UUID.

## 6. Stockage fichiers en v0.1, derrière les interfaces

**Décision** : `data/workspaces`, `data/evidence`, `data/ledger`, `data/missions` = fichiers JSONL + dossiers. Accès via `MissionRepository`, `EventStore`, `EvidenceStore`.

**Justification** : Simple, débuggable, zéro dépendance DB. SQLite (puis PostgreSQL si nécessaire) sera évalué uniquement si les limites du JSONL sont mesurées en usage réel — jamais une migration automatique programmée à une phase fixée d'avance. Le domaine ne change pas quel que soit le backend retenu.

**Conséquence** : Interface d'accès = contrat. Implémentation file-based. Futur = nouvelles implémentations.

## 7. Workspace isolé par mission, output = patch

**Décision** : Chaque mission = copie isolée du projet source. Aucune modification du projet live. Output = fichier `.patch`.

**Justification** : Sécurité. Testabilité. Pas de worktree persistant. Humain reprend le patch manuellement.

**Conséquence** : Aucun Git worktree persisté. Workspace nettoyé après mission. Mission échouée = patch incomplet ou absent.

## 8. Claude Code seul moteur, aucun fallback silencieux

**Décision** : `ModelAdapter` n'a qu'une implémentation : Claude Code. Si indisponible, mission échoue (`decision.requested` ou `mission.closed` avec erreur).

**Justification** : Évite les surprises. Pas d'« oublie et continue ». Fake adapter réservé aux tests.

**Conséquence** : Dégradation explicite de service. Policy décide d'un budget temps/tokens. Si budget atteint, mission échoue. Token requis sur l'API.

## 9. SSE pour le temps réel, pas de WebSocket en v0.1

**Décision** : CortexLab reçoit les mises à jour via `GET /api/stream` (Server-Sent Events), curseur `seq` pour reprise.

**Justification** : Unidirectionnel = plus simple. Reprise par curseur sans état serveur. Pas de fallback long-polling si possible. WebSocket reporté.

**Conséquence** : Client maintient le curseur local. Reconnexion = rejeu des événements manqués. Aucun push serveur vers plusieurs clients.

## 10. Token requis sur les mutations

**Décision** : `POST /api/missions`, `POST /api/missions/:id/cancel` nécessitent un header `Authorization: Bearer <token>`.

**Justification** : Minimaliste mais explicite. Multi-utilisateur futur sans casser la v0.1. Aucun utilisateur != toute permission.

**Conséquence** : .env.example contient `API_TOKEN`. Client Hermes doit passer le token. Pas de JWT, pas de refresh, token statique pour v0.1.

## 11. Une interface = au moins deux implémentations futures crédibles

**Décision** : Contrats (ModelAdapter, etc.) seulement si une second implémentation est crédible et non prématurée.

**Justification** : Évite sur-architecture et abstractions fictives. Aucun plugin system ni registre massif.

**Conséquence** : v0.1 a une implémentation réelle par contrat. Ajout futur = copie + adaptation, jamais mutation d'interface. Contrats versionnés = no-regrets.

## 12. Six documents canoniques, une seule branche main

**Décision** : VISION.md, ARCHITECTURE.md, UI-SPEC.md, DECISIONS.md, STATUS.md, NEXT.md. Aucun autre doc durable. Branche locale `main` seule.

**Justification** : Contexte maîtrisé, rescans minimalistes. Chaque document a une longueur max. Aucune branche par phase.

**Conséquence** : Docs lus avant chaque phase. NEXT.md = l'unique tâche active. Commits sur main. Pas de PR locale. Renvoi final au GitHub en un seul push une fois le MVP validé.

## 13. Rubik comme police officielle de Cortex

**Décision** : `--font-sans: "Rubik", "Inter", system-ui, sans-serif` pour toute l'interface (navigation, titres, boutons, corps, cartes, métriques) ; `--font-mono: "Geist Mono", ui-monospace, monospace` réservé aux identifiants, modèles, chemins, hashes et fragments de code. Auto-hébergée en WOFF2 (Regular + Bold uniquement), `font-display: swap`, licence dans `licenses/`, aucun CDN.

**Justification** : Remplace Gillius ADF (choix initial de la Phase 1) sur demande explicite. Rubik est géométrique, très lisible à petite taille, et distribuée par Google Fonts sous licence SIL OFL — plus simple à maintenir que la distribution Arkandis. Deux graisses seulement (Regular, Bold) car ce sont les seules réellement utilisées dans le prototype — pas de chargement de famille complète ni de la police variable.

**Conséquence** : `src/fonts/rubik/*.woff2` versionnés dans le dépôt, licence SIL OFL 1.1 documentée dans `licenses/RUBIK-OFL.txt`. Ajout d'une graisse future (ex. Medium) exige une justification d'usage réel avant d'être intégrée.

## 14. Rail d'icônes + sidecar contextuel, piloté par l'URL

**Décision** : La sidebar unique (224px) est remplacée par deux colonnes à `laptop:` : `IconRail` (~64px,
icônes seules, identique sur toutes les pages) et `Sidecar` (~224px, contenu dépendant de la route active).
Le filtre Missions et l'onglet actif de Mission Detail passent d'un `useState` local à un paramètre d'URL
(`?filter=`, `?tab=`) partagé entre le sidecar et le contenu de la page.

**Justification** : Demande explicite d'une navigation « bien plus minimaliste » qui « se détaille en
fonction de la page ». L'URL comme source de vérité évite d'introduire un contexte React entre deux
branches distinctes de l'arbre (`Sidecar` et l'écran ne sont pas parent/enfant) — cohérent avec le pattern
`?state=` déjà utilisé pour les démos. Le sidecar est conçu comme un **conteneur générique piloté par la
route**, pas une simple liste statique : `/missions/:id` le prouve déjà en y déplaçant les 6 sections de la
mission plutôt que de dupliquer un contenu figé.

**Conséquence** : En dessous de `laptop:`, rail et sidecar disparaissent entièrement ; les contrôles
équivalents redeviennent visibles dans le contenu (`laptop:hidden` sur les `TabsList` correspondants) pour
ne jamais perdre de fonctionnalité sur mobile/tablet. Emprise totale à `laptop:` ≈ 288px (rail + sidecar)
contre 224px pour l'ancienne sidebar unique — compromis assumé pour la lisibilité de chaque colonne.
Aucune fonctionnalité de chat ou de contenu conversationnel n'est ajoutée au sidecar : la piste évoquée
(« afficher les échanges d'une mission ») n'est pas spécifiée dans VISION.md et reste hors périmètre — le
conteneur est simplement conçu pour pouvoir l'accueillir plus tard sans réécriture.

## 15. Reskin light theme premium (remplace le dark cockpit)

**Décision** : Bascule complète du thème dark (graphite/indigo) vers un thème light (canvas #F6F7F9,
cartes blanches, accent bleu #0077E6), sur brief explicite « UI transformation pass ». Seules les
**valeurs** des tokens CSS et de la police changent — noms de variables, `Tone` (`lib/status.ts`),
props des composants (`Badge`, `BentoCard`, etc.) restent identiques.

**Justification** : Le brief cite les captures dark comme repoussoir (« too dark and uniform »,
« devtool appearance ») et fournit une palette hex précise. Garder les mêmes noms de tokens évite de
toucher aux contrats de composants — reskin, pas refonte.

**Conséquence** : Un seul hex codé en dur trouvé et corrigé (`Button.tsx` primary hover/active) — remplacé
par `brightness-110/95`, découplé de toute couleur précise pour éviter la récidive. `--color-text-muted`
n'était pas fourni par le brief ; ma première valeur (#9AA0AC) échouait le contraste AA sur blanc
(~2.6:1) — corrigée à #85898F (~3.2:1, AA « large texte » mais pas encore AA strict sur label 12px ;
limite documentée, pas cachée).

## 16. Retour à Inter (annule Rubik)

**Décision** : `--font-sans` repasse de Rubik à Inter, sur spécification explicite du brief (poids et
métriques exacts). Auto-hébergée en **un seul fichier variable** (`Inter-Variable.woff2`, axe `wght`
400–600) plutôt que trois fichiers statiques — un seul téléchargement couvre Regular/Medium/SemiBold.

**Justification** : `fonts.googleapis.com` s'est révélé joignable (contrairement à `fonts.google.com` et
aux autres miroirs testés en Phase 1), permettant de récupérer directement la police variable officielle
sans upload utilisateur cette fois. Licence SIL OFL 1.1 (`licenses/INTER-OFL.txt`).

**Conséquence** : `src/fonts/rubik/` supprimé. Ce changement de police en deux passes consécutives
(Gillius → Rubik → Inter) illustre que la police n'est pas une décision architecturale figée — elle suit
la direction visuelle demandée à chaque pass, sans effet sur le reste du système.

## 17. Substitution de la skill « Impeccable » (absente) par une auto-relecture en deux temps

**Décision** : Le brief désigne « Impeccable » comme seule source de qualité visuelle. Cette skill
n'existe pas sur ce compte (`ListSkills` vide, confirmé après `/reload-skills`). Remplacée par deux passes
d'auto-relecture explicites : composition/hiérarchie/densité, puis typo/espacement/contraste/responsive/
états — mêmes critères, sans skill tierce.

**Conséquence** : Deux bugs réels trouvés et corrigés en Pass 1 (nav mobile fixe chevauchant le contenu
dans les captures `fullPage`, libellés KPI tronqués mi-mot sur mobile) et un problème de contraste corrigé
en Pass 2 (`--color-text-muted`). Documenté pour traçabilité si « Impeccable » devient disponible plus
tard.

---

## Non-décisions (reportées)

- Auth multi-utilisateurs (v0.2).
- Mémoire long terme ou cross-mission (v0.2).
- Concurrence de missions (architecture prévue, non activée).
- Plugin system (jamais, contrats suffisent).
- Web dashboard pour multi-utilisateurs (v0.3 si pertinent).
