# Publication automatique — changements visuels

Pour les passes UI/UX demandées explicitement par le propriétaire du projet, le push peut être effectué directement sur `main` sans demander une validation supplémentaire lorsque le diff reste limité au frontend visuel :

- `src/screens/**`
- `src/components/**`
- `src/assets/**`
- `public/**`

Avant chaque push :

1. vérifier `git diff --check` ;
2. lancer `npm run typecheck`, `npm test` et `npm run build` ;
3. ne stage que les fichiers de la passe en cours ;
4. créer un commit court et cohérent ;
5. pousser directement `main` afin de déclencher le déploiement Vercel.

Ne pas pousser automatiquement si le diff touche `backend/**`, `api/**`, les scripts de déploiement, les dépendances, les variables d’environnement, la configuration Vercel, l’authentification ou des données persistantes. Dans ces cas, signaler précisément le périmètre et demander une validation avant publication.

Une passe visuelle cohérente correspond à un seul commit et un seul déploiement. Ne pas pousser à chaque sauvegarde intermédiaire.
