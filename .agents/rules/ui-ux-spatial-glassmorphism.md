# UI/UX: Standards Cortex-Lab (Liquid Glass, Physique & Chunky)

Cette règle définit l'approche esthétique et architecturale des interfaces du projet Cortex-Lab, afin de garantir une expérience utilisateur organique, fluide et premium.

## 1. L'Esthétique "Liquid Glass" (Glassmorphism Premium)

- **Pas de design plat ou terne** : L'interface doit être spatiale, lumineuse et texturée.
- **Profondeur & Reflets** : Utilisation intensive de fonds semi-transparents (`bg-white/40`), de flous d'arrière-plan prononcés (`backdrop-blur-xl`), et surtout d'ombres internes (ex: `shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_4px_12px_rgba(0,0,0,0.06)]`) pour simuler le reflet de la lumière sur des vitres bombées.
- **Ressenti tactile** : Les éléments au survol ne doivent pas juste changer de couleur, ils doivent donner une sensation "glissante" et liquide.

### Architecture Core & Wing
- **Le Core** : Verre plus dense, lumineux et solide (`bg-white/60`, `backdrop-blur-3xl`). Doit toujours être au-dessus.
- **La Wing** : Verre plus léger et en retrait (`bg-white/30`, `backdrop-blur-xl`). Doit sembler sortir de "sous" le Core avec une légère marge (`inset` / `mt-3`).

## 2. Animations Organiques et Physiques (L'effet "Apple")

- **Finies les animations rigides** : On bannit les transitions linéaires ou les `ease-in-out` standards et rapides.
- **Les ressorts (Springs) paramétrés** : L'apparition des modales (comme la recherche) utilise des physiques de ressort très calibrées (ex: `stiffness: 350, damping: 25, mass: 0.8` sous Framer Motion). L'interface a de l'inertie, elle "pop" de façon organique sans jamais rebondir de manière enfantine.
- **Courbes sur-mesure pour le CSS** : Les hovers utilisent des courbes complexes (`ease-[cubic-bezier(0.2,0.8,0.2,1)]`) sur des temps un peu plus longs (`duration-[400ms]`), accompagnés de subtils effets de micro-zoom (`hover:scale-[1.04]`) et de contraction au clic (`active:scale-[0.94]`).
- **Flou cinétique** : Utilisation d'animations de flou (`filter: blur(10px)` vers `0px`) lors de l'ouverture des fenêtres pour renforcer la notion d'espace 3D. *Attention :* Éviter d'animer le flou sur les conteneurs de textes bruts pour éviter l'aliasing.

## 3. Iconographie et Typographie : Le standard "Chunky"

- **Rejet du trait fin ("slop")** : Les bibliothèques d'icônes trop fines et génériques donnent un côté froid et austère.
- **La règle de l'épaisseur** : Les icônes doivent être "grasses", pleines, avec une forte densité de pixels. Elles agissent comme des ancres visuelles fortes et accueillantes (ex: Heroicons Solid).
- **Cohérence absolue (Poids Visuel)** : Si une icône n'existe pas en version pleine (comme la loupe de recherche), on doit impérativement hacker son épaisseur (ex: utiliser l'icône `Search` de Lucide-React avec `strokeWidth={3}`) pour que son poids visuel soit parfaitement identique à celui des icônes pleines du dock.
- Textes Accueillants : La typographie doit véhiculer un sentiment d'accueil et de confort. Des graisses moyennes à fortes, de l'espace pour respirer (paddings équilibrés), et des couleurs douces mais nettes.

## 4. Agencement : Le Cockpit Bar vs Le Bento Classique

- **Refus du Bento surchargé ("Template look")** : Pour des éléments de même niveau hiérarchique (comme des KPIs ou compteurs), il faut éviter d'empiler plusieurs petites cartes "Bento" indépendantes avec de fortes marges entre elles. Cela donne un aspect basique de template non fini et encombre l'écran de "boîtes".
- **Le Cockpit Bar (Unified Bar)** : Préférer regrouper ces éléments dans un seul conteneur global (une seule grosse carte `Card`). 
- **Compacité et Horizontalité** : Au sein de ce conteneur unifié, disposer les éléments en grille dense, en retirant les séparateurs de bordures s'ils alourdissent le design (`divide-x/y`). Réduire drastiquement la hauteur (paddings `py-3`, `px-5`) et la taille des typographies (`text-lg` pour la valeur, `text-[11px]` pour le label) pour obtenir une barre horizontale très fine, dense et élégante (comme le bandeau de commande d'un cockpit).
