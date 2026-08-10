# Working on Cortex-Lab

## One branch, one truth

`main` is both the working branch and the production branch. The repository deliberately does not use a permanent `develop`, `staging`, `hero-lab`, or feature-branch layer.

The normal loop is:

```bash
git switch main
git pull --ff-only origin main

# make one coherent change
npm run typecheck
npm test
npm run build

git add <the-files-you-changed>
git commit -m "area: describe the change"
git push origin main
```

Keep `main` deployable. Use small, coherent commits instead of long-lived test branches. If a visual experiment needs a separate surface, keep it behind an application route or a local query parameter; do not create a new remote branch for every variation.

## Autopush des passes visuelles

Pour les passes UI/UX du frontend, le push sur `main` est automatique en fin de passe : aucune validation intermédiaire n’est nécessaire lorsque les fichiers modifiés restent dans `src/screens/**`, `src/components/**`, `src/assets/**` ou `public/**`.

Le contrôle reste systématique : `git diff --check`, `npm run typecheck`, `npm test`, puis `npm run build`. Une passe cohérente produit un seul commit et un seul déploiement Vercel ; les sauvegardes intermédiaires ne sont pas publiées.

Les changements touchant le backend, l’API, l’authentification, les dépendances, les scripts de déploiement, la configuration Vercel, les secrets ou les données persistantes nécessitent encore une validation explicite avant push.

## Deployment contract

| Event | Result |
| --- | --- |
| Push to `main` | GitHub CI runs; Vercel builds and deploys production automatically |
| Push to another branch | No automatic Vercel deployment |
| `npm run deploy:vps` | Explicitly deploys the separate Fastify runtime to the VPS |

Vercel deployment selection is defined in `vercel.json`. The GitHub integration is intentionally limited to `main`, so a push has one obvious destination: production.

The Vercel deployment covers the frontend and `/api` proxy. The VPS runtime is a separate service and must still be deployed explicitly when backend runtime files change.

## What belongs in a commit

- Include only the files needed for the change.
- Run the checks above before pushing.
- Do not commit secrets, `.env` files, runtime data, or temporary screenshots.
- Keep `STATUS.md`, `NEXT.md`, and `ARCHITECTURE.md` aligned with the code that is actually deployed.

## Legacy branches

Older branches are kept temporarily because some contain historical or unreviewed work. They are not part of the active workflow. A legacy branch can be removed only after its pull request is closed and any useful change has been either merged or deliberately discarded.
