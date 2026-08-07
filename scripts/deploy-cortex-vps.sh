#!/usr/bin/env bash
set -Eeuo pipefail

log() { printf '\n\033[1;36m[cortex-deploy]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[cortex-deploy]\033[0m %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || fail "Relance avec sudo: sudo bash scripts/deploy-cortex-vps.sh"
command -v git >/dev/null || fail "git est requis"
command -v npm >/dev/null || fail "npm est requis"
command -v curl >/dev/null || fail "curl est requis"
command -v systemctl >/dev/null || fail "systemd est requis"

STATE_DIR="/etc/cortex"
REPO_ROOT_FILE="$STATE_DIR/repo-root"
ENV_FILE="$STATE_DIR/cortex-api.env"
SERVICE="cortex-api.service"

if [[ -f "$REPO_ROOT_FILE" ]]; then
  REPO_ROOT="$(cat "$REPO_ROOT_FILE")"
else
  REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
fi

[[ -n "$REPO_ROOT" && -d "$REPO_ROOT/.git" && -f "$REPO_ROOT/package.json" ]] \
  || fail "Checkout Cortex-Lab introuvable. Lance ce script depuis le repo ou provisionne /etc/cortex/repo-root."

cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Le checkout VPS contient des modifications suivies non commitées. Je refuse de les écraser."
fi

TOKEN=""
if [[ -f "$ENV_FILE" ]]; then
  TOKEN="$(sed -n 's/^CORTEX_API_TOKEN=//p' "$ENV_FILE" | head -n1)"
fi
[[ -n "$TOKEN" ]] || fail "CORTEX_API_TOKEN introuvable dans $ENV_FILE"

BEFORE_SHA="$(git rev-parse HEAD)"
log "Runtime actuel: ${BEFORE_SHA:0:12}"

if command -v /usr/local/sbin/cortex-backup >/dev/null 2>&1; then
  log "Backup des données runtime"
  /usr/local/sbin/cortex-backup
else
  log "Backup helper absent — création d'un backup minimal"
  BACKUP_DIR="/var/backups/cortex"
  install -d -m 700 "$BACKUP_DIR"
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  tar -czf "$BACKUP_DIR/cortex-data-$STAMP.tar.gz" data/missions data/ledger data/evidence
fi

log "Synchronisation avec origin/main"
git fetch --prune origin main
git checkout main
git pull --ff-only origin main
AFTER_SHA="$(git rev-parse HEAD)"
log "Runtime cible: ${AFTER_SHA:0:12}"

log "Installation déterministe des dépendances"
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

log "Validation TypeScript + build production"
npm run build

log "Redémarrage de $SERVICE"
systemctl restart "$SERVICE"

log "Vérification locale de l'API"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 3 -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4000/api/health >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

curl -fsS --max-time 5 -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4000/api/health >/dev/null \
  || { journalctl -u "$SERVICE" -n 80 --no-pager >&2; fail "Health check local en échec"; }

curl -fsS --max-time 5 -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:4000/api/events?cursor=0&limit=1" >/dev/null \
  || { journalctl -u "$SERVICE" -n 80 --no-pager >&2; fail "La nouvelle route /api/events n'est pas disponible après restart"; }

ACTIVE="$(systemctl is-active "$SERVICE" || true)"
[[ "$ACTIVE" == "active" ]] || fail "$SERVICE n'est pas actif"

printf '\n\033[1;32m[cortex-deploy] OK\033[0m\n'
printf '%-20s %s\n' "before:" "$BEFORE_SHA"
printf '%-20s %s\n' "after:" "$AFTER_SHA"
printf '%-20s %s\n' "service:" "$ACTIVE"
printf '%-20s %s\n' "health:" "200"
printf '%-20s %s\n' "events:" "200"
