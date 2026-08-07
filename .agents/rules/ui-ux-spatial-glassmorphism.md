# UI/UX — Standards Cortex-Lab : Chunky, tactile, éditorial

Cette règle définit le langage visuel Cortex-Lab. Le desktop reste la référence de qualité ; le mobile doit en être une recomposition dense et intentionnelle, jamais une simplification générique.

## 1. Identité : « editorial technical instrument »

Cortex doit paraître :
- précis,
- mature,
- calme,
- technique,
- tactile,
- dense mais respirable,
- humain sans être ludique au point de devenir gadget.

**Règle centrale : compact, pas maigre. Dense, pas plat. Mobile, pas générique.**

## 2. Surfaces et profondeur

- Pas de design terne ou purement plat : conserver une profondeur subtile avec bordures, reflets internes et ombres diffuses.
- Le verre est un accent, pas une religion. Ne pas appliquer `backdrop-blur` lourd et transparence à chaque rectangle.
- Sur desktop, le Core/Wing peut conserver une profondeur plus spatiale.
- Sur mobile, diminuer fortement blur, glow, textures pointillées et gros rayons lorsque ces effets réduisent la densité ou la lisibilité.
- Éviter les cartes imbriquées, les énormes ombres et les surfaces décoratives qui n'apportent aucune hiérarchie.

### Architecture Core & Wing
- **Core** : verre plus dense, lumineux et solide (`bg-white/60`, profondeur contrôlée).
- **Wing** : plus léger, en retrait et spatialement lié au Core.
- Cette architecture ne doit pas être copiée mécaniquement dans chaque carte mobile.

## 3. Mouvement physique, sans démonstration gratuite

- Les interactions doivent avoir de l'inertie et un feedback tactile.
- Préférer des springs calibrés ou `cubic-bezier(0.2,0.8,0.2,1)`.
- Press states courts et nets (`active:scale` léger).
- Pas de bounce enfantin, parallax gratuit ou blur animé en continu.
- Toujours respecter `prefers-reduced-motion`.

## 4. Iconographie et typographie : standard Chunky

### Iconographie
- Rejet du trait fin générique.
- Heroicons Solid est une bonne référence pour les ancres/navigation.
- Pour Lucide, viser généralement `strokeWidth={2.7–3.2}` quand l'icône cohabite avec des glyphes pleins.
- Les icônes sont des ancres visuelles, pas de petites décorations flottantes.

### Typographie
- Le gras fait partie de Cortex : titres forts, métriques massives, labels importants robustes.
- Ne pas résoudre le responsive en allégeant toute l'interface.
- Éviter en revanche de mettre **tout** en uppercase + bold + tracking élevé.
- Réserver l'uppercase aux petits labels techniques et ancres de section.
- Un label KPI primaire ne doit jamais être tronqué sur mobile : raccourcir le wording ou recomposer la grille.

## 5. Boutons : qualité desktop partout

- Les boutons importants conservent leur présence physique : typo solide, icône forte, bordure précise, highlight/ombre contrôlés, press state net.
- Pas de petits liens fins à la place d'une vraie action primaire.
- Une action mobile importante ne doit jamais dépendre du hover pour révéler son libellé.
- Touch target mobile : viser 44px minimum quand possible.

## 6. Cockpit Bar vs Bento

- Pour des métriques de même niveau, préférer un seul conteneur cockpit à une collection de mini-cartes identiques.
- Les KPIs doivent être denses, lisibles et directement comparables.
- Sur mobile, une grille 2×2 unifiée est acceptable si tous les labels restent lisibles sans ellipsis.
- Les cartes signature (mission, Core, agent modèle) peuvent garder des identités visuelles distinctes. Ne pas rendre chaque composant identique.

## 7. Mobile : recomposition obligatoire

Le mobile Cortex ne doit ressembler ni à un desktop compressé, ni à un template iOS.

### Cibles
- padding horizontal : 16–20px,
- gap sections : 16–24px,
- padding carte courant : 16–18px,
- dock mobile : environ 60–68px visuels + safe area,
- contenu : `dock + safe-area + >=20px` de marge basse.

Tester au minimum :
- 375×667,
- 390×844,
- 393×852,
- 430×932.

Tolérance zéro :
- overflow horizontal,
- texte primaire coupé,
- navbar qui recouvre le contenu,
- modal/palette hors écran,
- action utilisable uniquement au hover.

### Headers
- Pas de grand vide mort.
- Les watermark-icons décoratives sont desktop-first et doivent généralement être masquées sur mobile.
- Titre et action primaire peuvent partager la même ligne.

### Navigation mobile
- Conserver un **Cortex control dock**, pas une tab bar iOS générique.
- Icônes épaisses et géométrie d'état active intégrée à la surface.
- Ne pas ajouter un petit point sous l'icône active juste pour signifier l'état.

### Command palette
- Desktop : fenêtre flottante autorisée.
- Mobile : surface plein écran `100vw × 100dvh`, safe-area aware, recherche et fermeture explicites.

## 8. Statuts : bannir le « AI slop »

Ne pas parsemer l'UI de :
- `● ONLINE`,
- `● ACTIVE`,
- `● HEALTHY`,
- `● READY`,
- `● CONNECTED`,
- petites pastilles pastel d'état,
- petits points colorés isolés à droite d'une card agent.

Préférer :
- texte d'état intégré,
- icône d'état,
- bordure/accent latéral,
- couleur locale,
- métrique elle-même.

Les points colorés restent légitimes pour une vraie légende de graphe ou une visualisation de données.

## 9. Anti-template explicite

Éviter :
- copie d'Apple Settings,
- template fintech/SaaS mobile,
- structure automatique `titre → search → segmented pills → rows → tabbar` sur chaque page,
- gradients bleu/violet « AI »,
- blobs décoratifs,
- glassmorphism partout,
- énormes pills 24–32px pour chaque contrôle,
- `icon + label + chevron` répété partout,
- sous-titre gris sous chaque titre,
- badges décoratifs,
- espaces verticaux disproportionnés,
- bento générique où toutes les cartes ont la même personnalité.

## 10. Intentions par écran

### Overview
Priorité : missions et situation actuelle → activité → tokens → infrastructure compacte.
Ne pas construire une simple pile de widgets.

### Missions
Action de création visible, recherche compacte, filtres denses, cartes missions scannables et fortes. L'état doit être intégré à la carte, sans pill générique.

### System
Core, Claude Code et OpenAI gardent leur caractère desktop. Sur mobile : réduire de 25–40% la hauteur naïve, masquer les textures superflues, formater intelligemment uptime/stockage et regrouper Ledger/Storage/SSE de façon dense.

## 11. Test de cohérence

À la fin d'une passe UI, poser la question :

> Si le logo Cortex disparaissait, est-ce que le mobile ressemblerait toujours au même produit que le desktop ?

Si non, la traduction mobile a dérivé et doit être reprise.
