#!/usr/bin/env bash
set -Eeuo pipefail

log() { printf '\n\033[1;36m[cortex-deploy]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[cortex-deploy]\033[0m %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || fail "git est requis"
command -v npm >/dev/null || fail "npm est requis"
command -v curl >/dev/null || fail "curl est requis"
command -v pm2 >/dev/null || fail "pm2 est requis"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$REPO_ROOT" && -d "$REPO_ROOT/.git" && -f "$REPO_ROOT/package.json" ]] \
  || fail "Lance ce script depuis le checkout Cortex-Lab."
cd "$REPO_ROOT"

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Le checkout VPS contient des modifications suivies non commitées. Commit/stash avant le deploy."
fi

[[ -f .env ]] || fail ".env introuvable dans $REPO_ROOT"
read_env() {
  local key="$1"
  sed -n "s/^${key}=//p" .env | tail -n1 | sed -e 's/^"//' -e 's/"$//'
}

API_PORT_VALUE="$(read_env API_PORT)"
API_PORT_VALUE="${API_PORT_VALUE:-8080}"
API_HOST_VALUE="$(read_env API_HOST)"
API_HOST_VALUE="${API_HOST_VALUE:-127.0.0.1}"
TOKEN="$(read_env CORTEX_API_TOKEN)"
SESSION_SECRET="$(read_env CORTEX_SESSION_SECRET)"

if [[ ${#SESSION_SECRET} -lt 32 ]]; then
  fail "CORTEX_SESSION_SECRET doit contenir au moins 32 caractères dans .env"
fi

if [[ "$API_HOST_VALUE" != "127.0.0.1" && "$API_HOST_VALUE" != "localhost" && "$API_HOST_VALUE" != "::1" && -z "$TOKEN" ]]; then
  fail "Refus de déployer une API publique (${API_HOST_VALUE}:${API_PORT_VALUE}) sans CORTEX_API_TOKEN dans .env"
fi

pm2 describe cortex-api >/dev/null 2>&1 || fail "Process PM2 cortex-api introuvable"

BEFORE_SHA="$(git rev-parse HEAD)"
log "Runtime actuel: ${BEFORE_SHA:0:12}"

BACKUP_DIR="/var/backups/cortex"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR" || true
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_PATH="$BACKUP_DIR/cortex-data-$STAMP.tar.gz"
BACKUP_ITEMS=()
for item in data/missions data/ledger data/evidence data/auth; do
  [[ -e "$item" ]] && BACKUP_ITEMS+=("$item")
done
if (( ${#BACKUP_ITEMS[@]} > 0 )); then
  log "Backup runtime → $BACKUP_PATH"
  tar -czf "$BACKUP_PATH" "${BACKUP_ITEMS[@]}"
fi

restore_checkout() {
  log "Restauration du checkout ${BEFORE_SHA:0:12}"
  git reset --hard "$BEFORE_SHA" >/dev/null
}

log "Synchronisation origin/main"
git fetch --prune origin main
git checkout main
git pull --ff-only origin main
AFTER_SHA="$(git rev-parse HEAD)"
log "Runtime cible: ${AFTER_SHA:0:12}"

log "Installation déterministe"
if ! npm ci; then
  restore_checkout
  fail "npm ci a échoué — runtime PM2 inchangé"
fi

log "Build production"
if ! npm run build; then
  restore_checkout
  fail "build en échec — runtime PM2 inchangé"
fi

log "Tests"
if ! npm test; then
  restore_checkout
  fail "tests en échec — runtime PM2 inchangé"
fi

AUTH_ARGS=()
[[ -n "$TOKEN" ]] && AUTH_ARGS=(-H "Authorization: Bearer $TOKEN")
LOCAL_HEALTH="http://127.0.0.1:${API_PORT_VALUE}/api/health"
LOCAL_EVENTS="http://127.0.0.1:${API_PORT_VALUE}/api/events?cursor=0&limit=1"

log "Restart PM2 cortex-api"
pm2 restart cortex-api --update-env >/dev/null

healthy=false
for _ in $(seq 1 30); do
  if curl -fsS --max-time 4 "${AUTH_ARGS[@]}" "$LOCAL_HEALTH" >/dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep 1
done

if [[ "$healthy" != "true" ]] || ! curl -fsS --max-time 5 "${AUTH_ARGS[@]}" "$LOCAL_EVENTS" >/dev/null 2>&1; then
  log "Nouveau runtime non sain — rollback automatique"
  pm2 logs cortex-api --lines 80 --nostream >&2 || true
  git reset --hard "$BEFORE_SHA" >/dev/null
  npm ci >/dev/null 2>&1 || true
  npm run build >/dev/null 2>&1 || true
  pm2 restart cortex-api --update-env >/dev/null || true
  fail "Deploy annulé et rollback vers ${BEFORE_SHA:0:12}"
fi

pm2 save >/dev/null 2>&1 || true

printf '\n\033[1;32m[cortex-deploy] OK\033[0m\n'
printf '%-18s %s\n' "before:" "$BEFORE_SHA"
printf '%-18s %s\n' "after:" "$AFTER_SHA"
printf '%-18s %s\n' "pm2:" "cortex-api online"
printf '%-18s %s\n' "health:" "200"
printf '%-18s %s\n' "events:" "200"
