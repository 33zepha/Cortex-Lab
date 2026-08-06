# UI-SPEC

## Direction visuelle

### Caractère global

- **Light mode premium** par défaut (révisé — le dark mode profond de la Phase 1 est abandonné sur
  demande explicite : cockpit analytics clair plutôt que dashboard sombre).
- Palette : canvas gris très clair (#F6F7F9), cartes blanches, bordures fines gris-bleu.
- Accent unique : bleu électrique (#0077E6), **mesuré et fonctionnel** (jamais de néon).
- Bento à hiérarchie intentionnelle : cartes de tailles différentes selon leur importance, jamais
  7 cartes identiques.
- Typographie Inter, échelle nommée stricte (titre de page / métrique / label / corps / filtre).
- Aucun gradient décoratif, aucune ombre lourde, animations rapides (120–220 ms) et fonctionnelles.
- Finition analytics premium : Apple pour la retenue, Linear pour la clarté, Ramp pour la composition.

### Références perçues

Linear, Ramp, interfaces Apple modernes ; structure générique de kit dashboard (sidebar+topbar,
grille de cartes, table dense, filtres, feed d'activité) comme référence de patterns, pas d'extraction
littérale d'un fichier source.

### Interdits absolus (repris du brief)

- Admin dashboard générique.
- Cyberpunk ou sombre sans intention.
- Néons omniprésents.
- Petites cartes empilées partout.
- Métriques inventées.
- Faux avatars d'agents.
- Animations simulant « l'IA qui réfléchit ».
- Composants Radix Primitives laissés à l'apparence par défaut.
- Glassmorphism excessif.
- Logs bruts comme interface principale.

Le résultat évoque un **système d'exploitation personnel pour les missions complexes**, pas un tableau de bord technique.

---

## Structure de navigation

### Rail d'icônes + sidecar contextuel (navigation primaire)

**Deux colonnes minimalistes, accolées**, visibles à `laptop:` (≥1280px) — implémentées en Phase 1
(`IconRail` + `Sidecar`) :

- **`IconRail`** (~64px) : logo Cortex, déclencheur ⌘K, 3 icônes de section (Overview/Missions/System —
  jamais de libellé visible, `Tooltip` au survol/focus), pastille de santé Cortex en pied. Identique quelle
  que soit la page active.
- **`Sidecar`** (~224px) : accolé au rail, **toujours visible** (pas de toggle ni de flyout). Son contenu
  dépend de la route active — navigation secondaire propre à chaque page, jamais un doublon des données du
  contenu principal :
  - `/` (Overview) → raccourcis contextuels (mission active, décisions requises s'il y en a).
  - `/missions` → les 5 filtres (All/Active/Needs review/Completed/Failed) en liens verticaux, pilotés par
    `?filter=` dans l'URL.
  - `/missions/:id` (Mission Detail) → les 6 sections de la mission (Timeline/Fichiers/Tests/Preuves/
    Patch/Erreurs) en navigation verticale, pilotées par `?tab=`. C'est la preuve que le sidecar est un
    **conteneur générique piloté par la route** : plus on entre dans le détail, plus son contenu peut
    s'enrichir, sans toucher au rail ni aux autres pages.
  - `/system` → 6 liens d'ancrage vers les blocs de santé.
- **En dessous de `laptop:`** (mobile/tablet) : rail et sidecar disparaissent entièrement. `MobileNav`
  (barre du bas, 3 icônes + recherche) reste la navigation principale, et les contrôles équivalents
  reviennent dans le contenu (onglets de filtre Missions, onglets horizontaux Mission Detail) — jamais les
  deux à la fois sur un même breakpoint.

### Command palette (⌘K)

Lance rapide pour toutes les opérations principales. À implémenter en Phase 4, mais prévoir dès Phase 1.

Commandes :

- `Create mission` — formulaire rapide ou boîte de dialogue.
- `Search missions` — fuzzy search par objectif.
- `Open evidence` — accès direct aux preuves récentes.
- `Cancel mission` — annuler la mission active.
- `Show system health` — affichage synthétique.
- `Navigate to [page]` — sauts vers Overview, Missions, Evidence, System.

---

## Écrans

### Overview

**Bento dashboard**, données réelles uniquement. Pas de métriques décoratives.

Cartes proposées (à adapter selon l'état réel) :

1. **Mission active** (grande carte) : objectif, statut, étape, durée, modèle, progression (%) ; bouton `View Details` ; état `empty` si aucune mission en cours.
2. **Missions awaiting decision** : liste dense, objectif + prompt de décision ; état `empty` si aucune.
3. **Recent activity** : timeline réduite des derniers événements.
4. **Cortex health** : disponibilité (polling), workspace utilisé, SSE connectés. État indicateur rouge/orange/vert.
5. **Claude Code health** : disponibilité du modèle, dernier appel, rate limit approchant.
6. **Recently completed** : dernières 3–5 missions closes (objective, result, duration).
7. **Errors & blockers** : si des missions ont échoué, afficher.
8. **Quick actions** : boutons `New mission`, `View all missions`, `System logs`.

Disposition : grid 12 colonnes. Grande carte (mission active) = 8 cols. Deux cartes à droite = 4 cols chacune empilées. Autres cartes adaptables (4 à 12 cols).

**États** : chargement (skeleton subtle), vide (message clair, pas d'icône vide), données (live).

### Missions (liste)

Liste dense mais respirante, dense par défaut.

Colonnes :

| Champ | Largeur | Contenu |
|-------|---------|---------|
| Objectif | 40% | Titre court (troncature intelligente) |
| Statut | 12% | Badge : `running`, `completed`, `failed`, `cancelled`, `awaiting-decision` |
| Étape | 12% | Texte court : `planning`, `execution`, `testing`, `closure` |
| Durée | 10% | Secondes ou `en cours` |
| Modèle | 10% | `claude-code` (futur : icônes si plusieurs) |
| Fichiers modifiés | 8% | Nombre ou icône de visibilité |
| Résultat | 8% | Icône success/fail ou texte court |

**Filtres** : onglets ou dropdown

- All
- Active
- Needs review (status = awaiting-decision)
- Completed
- Failed

**Actions par ligne** : hover → boutons `View`, `Evidence`, `Cancel` (si active).

**États** : chargement (skeleton de liste), vide (message + bouton `Create mission`), données.

**Tri** : par défaut `createdAt` descendant (plus récent en haut). Colonnes triables.

### Mission Detail (écran central)

Écran principal du produit. Deux panneaux : principal (gauche, 75%) + inspection (droite, 25%).

#### Panneau principal

En-tête (sticky) :

```
[← Back]  Objective: "..."
          Status: [running|completed|failed|cancelled]
          Step: "..." | Duration: "12m 34s"
          Model: "claude-code"
```

Contenu (tabs ou scroll) :

1. **Timeline** (par défaut)
   - Une ligne par événement, groupée par étape (plan, step 1, step 2, …, closure).
   - Rendu lisible :
     ```
     [plan] → Plan formulated
       └─ 3 steps identified
       └─ Constraints applied
     [step 1: read config] → Started 12:34:56
       └─ Files read: config.json, package.json
       └─ [expandable → shows file paths]
     [step 2: modify] → Files modified 12:35:10
       └─ src/index.ts (5 lines added)
       └─ [expandable → side-by-side diff]
     [step 3: test] → Tests completed 12:35:45
       └─ ✓ 4 passing
       └─ [expandable → test output]
     [closure] → Mission closed 12:36:00
       └─ Result: success
       └─ Patch generated
     ```
   - Jamais de JSON brut.
   - Chaque entrée dépliable (chevron) → accès à la preuve complète.

2. **Files** (tab)
   - Listes : fichiers consultés (read-only), fichiers modifiés (avec taille du diff).
   - Clic → affiche le fichier ou le diff dans l'inspection.

3. **Tests** (tab)
   - Résumé des tests (passed / failed / skipped).
   - Liste ou arborescence des tests, expandable.
   - Clic → affiche output dans l'inspection.

4. **Evidence** (tab)
   - Tous les artefacts : tests, diffs, logs structurés, artifacts.
   - Filtrable par type.

5. **Patch** (tab)
   - Diff complet, unifiée ou side-by-side.
   - Champ `description` pour expliquer le patch (pré-rempli par Cortex).
   - Boutons : `Copy to clipboard`, `Download as .patch`, `View in diff tool`.

6. **Errors & Decisions** (tab)
   - Liste des erreurs rencontrées.
   - Si `decisionRequired` est true : affiche le prompt et un formulaire de réponse.

#### Panneau d'inspection (droite, contextuel)

Affiche le détail sélectionné dans le panneau principal (expandable dans la timeline, ou clic sur un fichier/test).

Contenu polymorphe :

- **Pour un événement** : payload complet, lisible et coloré. Pas de JSON brut, mais une vue structurée.
- **Pour un fichier** : contenu du fichier (avec hilight du langage) ou diff side-by-side.
- **Pour un test** : output, trace d'erreur, durée.
- **Pour une preuve** : texte, image (si artifact), ou lien de téléchargement.

État `empty` si rien n'est sélectionné : message léger.

**Responsive (desktop → tablet) :** panneau d'inspection se ferme ou devient une feuille modale au bas de l'écran.

### System

**Santé du moteur**, simple.

Cartes :

1. **Cortex server** : status (running/stopped), uptime, mémoire utilisée, CPU.
2. **Claude Code availability** : connected/disconnected, latency, last call, tokens used today.
3. **Ledger** : événements enregistrés (total), taille fichier, dernière opération.
4. **Workspace storage** : missions en cours, espace utilisé, quota.
5. **SSE health** : clients connectés, cursor moyen, lag moyen.
6. **Recent errors** : liste des dernières erreurs au niveau système (pas les erreurs de mission).

**Action** : bouton `Export logs` (Phase ultérieure) ou `Download system state`.

**État** : données live via /api/health ; refresh manuel ou auto-poll toutes les 5–10 sec.

---

## États et patterns

### États par écran

| Écran | Chargement | Vide | Données | Erreur |
|-------|--|--|--|--|
| Overview | Skeleton de grille | Message + CTA | Cartes pleines | Banner rouge |
| Missions | Skeleton de liste | "No missions yet" + `Create` | Lignes | Banner |
| Mission Detail | Skeleton | — | Timeline + tabs | Banner + retry |
| System | Spinner discret | — | Cartes | Banner + health badge orange |

### États de mission

- `running` → badge violet/indigo, animation discète (pulse ou underline).
- `completed` → badge vert.
- `failed` → badge rouge.
- `cancelled` → badge gris.
- `awaiting-decision` → badge orange, pulsation légère.

### Interactions

- **Hover** : fond + bordure légèrement plus claire, curseur pointer. Pas de shake, pas d'échelle.
- **Focus** : outline ~2 px, couleur accent, contenu lisible.
- **Clic** : pas de transition > 200 ms. Feedback immédiat.
- **SSE update** : timeline se met à jour sans rechargement complet ; event nouveau = animation d'entrée douce (~300 ms).

---

## Design tokens

**À nommer en anglais, prêts pour Tailwind en Phase 1.**

### Couleurs

Table à jour avec `src/styles/tokens.css` (implémentation Phase 1) — c'est le fichier qui fait foi en cas d'écart.

| Token CSS | Hex | Sémantique |
|-------|-----------|-----------|
| `--color-background` | #f6f7f9 | Canvas (fond de page) |
| `--color-surface-1` | #ffffff | Cartes, surfaces de contenu |
| `--color-surface-2` | #f1f4f8 | Surface subtile (hover, inputs) |
| `--color-surface-3` | #e9edf3 | Overlays, sélections, skeleton |
| `--color-text-primary` | #333333 | Texte principal |
| `--color-text-secondary` | #777777 | Texte secondaire (valeur du brief) |
| `--color-text-muted` | #85898f | Texte discret ; assombri depuis #9aa0ac (Pass 2) pour rester lisible — reste sous 4.5:1 AA strict, voir DECISIONS.md |
| `--color-accent-indigo` | #0077e6 | Accent principal (running, liens, focus) — anciennement indigo, même nom de token |
| `--color-accent-electric` | #519dfa | Accent secondaire (info, ligne de tendance) |
| `--chart-line` | #519dfa | Ligne de tendance des graphiques |
| `--chart-bar` | #0077e6 | Barres des graphiques |
| `--color-success` | #16a36a | Succès, tests passants |
| `--color-warning` | #d99000 | Avertissement, décision requise |
| `--color-error` | #d94a5a | Erreur, mission échouée |
| `--color-info` | #519dfa | Information |
| `--color-border` | #e5e8ee | Bordures normales |
| `--color-border-strong` | #d8dce4 | Bordures hover/actives |
| `--color-border-focus` | #0077e6 | Anneau de focus clavier |

### Typographie

Échelle numérique (`--text-xs`..`--text-4xl`, usage libre) inchangée. Au-dessus, une **échelle nommée**
(Tailwind `fontSize`, une classe = taille + line-height + poids + tracking) reprend exactement les
styles du brief :

| Classe Tailwind | Taille/line-height | Poids | Usage |
|-------|--------|-------|-------|
| `text-page-title` | 24/32 | 600 (SemiBold) | Titre de page (topbar) |
| `text-metric` | 18/24, `-0.1px` | 600 (SemiBold) | Valeurs chiffrées (KPI, métriques) |
| `text-label` | 12/16 | 500 (Medium) | Eyebrows, en-têtes de colonnes, métadonnées |
| `text-body-text` | 13/20 | 400 (Regular) | Corps de texte |
| `text-filter` | 13/16 | 500 (Medium) | Filtres compacts (28px de haut) |

**Police officielle : Inter** (révisé — remplace Rubik sur demande explicite de ce brief).

```
--font-sans: "Inter", system-ui, -apple-system, sans-serif;
--font-mono: "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace;
```

Inter (Google Fonts, SIL OFL 1.1) porte toute l'interface. Auto-hébergée en **un seul fichier variable**
(`Inter-Variable.woff2`, axe `wght` 400–600 — Regular/Medium/SemiBold dans un seul téléchargement, plus
léger que trois fichiers statiques), `font-display: swap`, aucun CDN. Licence dans `licenses/`. Geist Mono
reste réservé aux identifiants, chemins, hashes et fragments de code. Chiffres tabulaires
(`font-feature-settings: "tnum" 1`) dans les tableaux et métriques.

### Espacement

Échelle 4 px, 13 crans : 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px (`--space-0` à `--space-24`).

### Rayons

- `--radius-sm` : 6 px (badges, inputs)
- `--radius-md` : 10 px (boutons, petites cartes)
- `--radius-lg` : 14 px (cartes, panneaux)
- `--radius-xl` : 20 px (dialogs, drawers)
- `--radius-full` : cercle complet (dots de statut, avatars)

### Bordures

- `--color-border` : 1 px solid, bordures normales
- `--color-border-strong` : 1 px solid, hover/actif
- `--color-border-focus` : anneau de focus clavier

### Ombres

- `--shadow-sm` : `0 1px 2px rgba(0,0,0,0.3)`
- `--shadow-md` : `0 4px 16px -4px rgba(0,0,0,0.45)`
- `--shadow-lg` : `0 12px 32px -8px rgba(0,0,0,0.55)`
- `--shadow-focus` : anneau indigo 3 px (focus accessible)

### Animation

- `duration.fast` : 120 ms
- `duration.standard` : 200 ms
- `duration.slow` : 300 ms
- `easing.ease-in-out` : `cubic-bezier(0.4, 0, 0.2, 1)`

### Accessibilité

- Contraste minimum AA (4.5:1) pour texte sur surfaces.
- Focus ring : `2px solid color.border.active`.
- Live region : `aria-live="polite"` pour SSE updates.
- Respecter `prefers-reduced-motion`.

---

## Responsive

### Breakpoints

- **Desktop** : 1280+ px (12 colonnes bento).
- **Tablet** : 768–1279 px (8 colonnes, panneaux empilés partiellement).
- **Mobile** : < 768 px (4 colonnes, panneau d'inspection → feuille modale).

### Adaptation par écran

- **Overview** : grille flexible, ajustement des cartes.
- **Missions** : défilement horizontal des colonnes sur mobile, ou affichage en cards au lieu de tableau.
- **Mission Detail** : panneau principal prend toute la largeur, inspection devient un drawer au bas. Timeline reste lisible.
- **System** : cartes en grid flexible.

### Cibles tactiles

Minimum 44 px × 44 px pour tous les boutons et zones interactives.

---

## Composants clés (à construire Phase 1)

- **Card** : conteneur avec bordure, ombre, padding standard.
- **Button** : primary (indigo), secondary (gris), ghost (bordure seule).
- **Badge** : petit label pour status (colors sémantiques).
- **Timeline** : composition de lignes et événements.
- **Diff viewer** : side-by-side ou unifiée.
- **Command palette** : input + fuzzy search + results.
- **Drawer/Modal** : panneau latéral ou overlay.
- **Loading skeleton** : placeholders animés.
- **Live region** : zone `aria-live` pour annonces SSE.

Tous construits sur Radix Primitives + Tailwind, jamais laissés par défaut.
