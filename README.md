# Cortex-Lab

Cortex-Lab is the product repository for Cortex: the operator-facing application, its Vercel API proxy, and the runtime integration used by the cockpit.

## Source of truth

`main` is the only active development and production branch.

- Pushes to `main` run GitHub CI and trigger the Vercel production deployment.
- `cortexlab.online` is the production surface.
- `/hero-lab` is an application route for the landing-page experience; it is not a permanent Git branch.
- Existing `agent/*`, `feat/*`, `fix/*`, `ops/*`, `preview/*`, and `cortexlab/hero-lab` branches are legacy workspaces. Do not create new branches for routine work.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact daily workflow and deployment boundaries.
