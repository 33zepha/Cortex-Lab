# Développement local Cortex

Le workflow normal est volontairement simple :

1. Développer sur le Mac avec `npm run dev`.
2. Ouvrir `http://localhost:5173`.
3. Le frontend local utilise le vrai backend Cortex du VPS via Tailscale, donc les mêmes missions, événements et données que la production.
4. Quand une version mérite d'être publiée/testée sur iPhone, commit + push sur `main`.
5. Vercel construit uniquement `main` et publie `cortexlab.online`.

## Prérequis local

Le Mac doit être connecté au tailnet Tailscale qui contient le VPS Cortex.

Par défaut, Vite proxy `/api/*` vers :

`http://100.85.93.10:8080`

Pour pointer temporairement vers un autre backend sans modifier le code :

```bash
CORTEX_DEV_API_ORIGIN=http://autre-host:8080 npm run dev
```

## Commandes quotidiennes

```bash
npm ci        # première installation / après changement du lockfile
npm run dev   # développement local
```

Puis, quand la version est prête à être publiée :

```bash
git add .
git commit -m "..."
git push origin main
```

Le déploiement du VPS n'est pas couplé aux pushes frontend. Le backend reste un service séparé et stable.
