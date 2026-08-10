# Cortex-Lab

Cortex-Lab is the product repository for Cortex: the operator-facing application, its Vercel API proxy, and the runtime integration used by the cockpit.

## Source of truth

`main` is the only active development and production branch.

- Pushes to `main` run GitHub CI and trigger the Vercel production deployment.
- `cortexlab.online` is the production surface.
- `/hero-lab` is an application route for the landing-page experience; it is not a permanent Git branch.
- Existing `agent/*`, `feat/*`, `fix/*`, `ops/*`, `preview/*`, and `cortexlab/hero-lab` branches are legacy workspaces. Do not create new branches for routine work.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the exact daily workflow and deployment boundaries.

## Codex environment

The repository includes a local Codex environment at `.codex/environments/environment.toml`.
Its setup script runs `npm ci` and makes sure Playwright Chromium can actually launch, so browser validation is ready in new worktrees without a manual reinstall.

For a Codex Cloud environment, set its setup script to:

```bash
bash scripts/codex-setup.sh
```
