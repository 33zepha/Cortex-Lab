#!/usr/bin/env bash
set -Eeuo pipefail

log() { printf '\n\033[1;36m[cortex-bootstrap]\033[0m %s\n' "$*"; }
ok() { printf '\n\033[1;32m[cortex-bootstrap]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[cortex-bootstrap]\033[0m %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || fail "Ce bootstrap doit être lancé en root sur le VPS Cortex."
for cmd in git npm pm2 curl tailscale python3 openssl ssh-keygen; do
  command -v "$cmd" >/dev/null || fail "$cmd est requis"
done

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$REPO_ROOT" && -f "$REPO_ROOT/package.json" ]] || fail "Lance ce script depuis /root/Cortex-Lab."
cd "$REPO_ROOT"
[[ -f .env ]] || fail ".env introuvable"

if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "Le checkout contient des modifications suivies. Commit/stash avant le bootstrap."
fi

log "Synchronisation du code sans toucher au process PM2 actuel"
git fetch --prune origin main
git checkout main
git pull --ff-only origin main

log "Validation du runtime cible"
npm ci
npm run build
npm test

read_env() {
  local file="$1" key="$2"
  sed -n "s/^${key}=//p" "$file" | tail -n1 | sed -e 's/^"//' -e 's/"$//'
}

set_env() {
  local file="$1" key="$2" value="$3"
  python3 - "$file" "$key" "$value" <<'PY'
from pathlib import Path
import sys
p = Path(sys.argv[1]); key = sys.argv[2]; value = sys.argv[3]
lines = p.read_text().splitlines() if p.exists() else []
out = []
replaced = False
for line in lines:
    if line.startswith(key + "="):
        if not replaced:
            out.append(f"{key}={value}")
            replaced = True
    else:
        out.append(line)
if not replaced:
    out.append(f"{key}={value}")
p.write_text("\n".join(out) + "\n")
PY
}

API_PORT_VALUE="$(read_env .env API_PORT)"
API_PORT_VALUE="${API_PORT_VALUE:-8080}"
[[ "$API_PORT_VALUE" == "8080" ]] || log "Port API actuel détecté: $API_PORT_VALUE (le bootstrap conservera cette valeur)"

TOKEN="$(read_env .env CORTEX_API_TOKEN)"
if [[ -z "$TOKEN" ]]; then
  TOKEN="$(openssl rand -hex 32)"
fi

SECURE_ENV=".env.secure-next"
cp .env "$SECURE_ENV"
chmod 600 "$SECURE_ENV"
set_env "$SECURE_ENV" API_HOST 127.0.0.1
set_env "$SECURE_ENV" API_PORT "$API_PORT_VALUE"
set_env "$SECURE_ENV" CORTEX_API_TOKEN "$TOKEN"
set_env "$SECURE_ENV" CORTEX_ALLOWED_ORIGINS https://cortexlab.online
set_env "$SECURE_ENV" CORTEX_ALLOW_UNAUTHENTICATED_PUBLIC 0
set_env "$SECURE_ENV" CORTEX_ALLOW_SOURCE_ROOT_OVERRIDE 0
set_env "$SECURE_ENV" CORTEX_MAX_ACTIVE_MISSIONS 2

CANARY_NAME="cortex-api-canary"
CANARY_PORT=8081
pm2 delete "$CANARY_NAME" >/dev/null 2>&1 || true

cleanup_canary() {
  pm2 delete "$CANARY_NAME" >/dev/null 2>&1 || true
}
trap cleanup_canary EXIT

log "Démarrage d'une API sécurisée temporaire sur 127.0.0.1:${CANARY_PORT}"
API_HOST=127.0.0.1 \
API_PORT="$CANARY_PORT" \
CORTEX_API_TOKEN="$TOKEN" \
CORTEX_ALLOWED_ORIGINS=https://cortexlab.online \
CORTEX_ALLOW_UNAUTHENTICATED_PUBLIC=0 \
CORTEX_ALLOW_SOURCE_ROOT_OVERRIDE=0 \
CORTEX_MAX_ACTIVE_MISSIONS=2 \
pm2 start npm --name "$CANARY_NAME" -- run api >/dev/null

for _ in $(seq 1 30); do
  if curl -fsS --max-time 4 -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:${CANARY_PORT}/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 5 -H "Authorization: Bearer $TOKEN" "http://127.0.0.1:${CANARY_PORT}/api/health" >/dev/null \
  || { pm2 logs "$CANARY_NAME" --lines 80 --nostream >&2 || true; fail "Canary sécurisée indisponible"; }

UNAUTH_CODE="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${CANARY_PORT}/api/health" || true)"
[[ "$UNAUTH_CODE" == "401" ]] || fail "La canary n'impose pas correctement l'authentification (HTTP $UNAUTH_CODE)"

TS_DNS="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin).get("Self",{}).get("DNSName","").rstrip("."))')"
[[ -n "$TS_DNS" ]] || fail "Impossible de déterminer le nom MagicDNS du VPS"
FUNNEL_ORIGIN="https://${TS_DNS}:8443"

log "Activation de Tailscale Funnel HTTPS :8443 vers la canary"
while ! tailscale funnel --bg --yes --https=8443 "127.0.0.1:${CANARY_PORT}"; do
  printf '\nTailscale peut demander une validation Funnel dans le navigateur. Ouvre le lien affiché ci-dessus, valide, puis reviens ici.\n'
  read -r -p "Appuie sur Entrée après validation Funnel... " _
done

for _ in $(seq 1 20); do
  if curl -fsS --max-time 8 -H "Authorization: Bearer $TOKEN" "$FUNNEL_ORIGIN/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 2
done
curl -fsS --max-time 10 -H "Authorization: Bearer $TOKEN" "$FUNNEL_ORIGIN/api/health" >/dev/null \
  || fail "Funnel HTTPS n'atteint pas la canary"

DEPLOY_KEY="$HOME/.ssh/cortex_github_actions"
install -d -m 700 "$HOME/.ssh"
if [[ ! -f "$DEPLOY_KEY" ]]; then
  ssh-keygen -q -t ed25519 -N '' -C 'cortex-github-actions' -f "$DEPLOY_KEY"
fi
chmod 600 "$DEPLOY_KEY"
chmod 644 "$DEPLOY_KEY.pub"
touch "$HOME/.ssh/authorized_keys"
chmod 600 "$HOME/.ssh/authorized_keys"
PUB_KEY="$(cat "$DEPLOY_KEY.pub")"
grep -Fqx "$PUB_KEY" "$HOME/.ssh/authorized_keys" || printf '%s\n' "$PUB_KEY" >> "$HOME/.ssh/authorized_keys"

cat <<EOF

============================================================
ÉTAPE UNIQUE DANS VERCEL — Production Environment Variables
============================================================
CORTEX_API_ORIGIN=$FUNNEL_ORIGIN
CORTEX_API_TOKEN=$TOKEN

Ajoute/remplace ces 2 variables pour Production puis redeploie le dernier commit main.
Le bootstrap reste ouvert et détectera tout seul le nouveau chemin sécurisé.
============================================================
EOF

log "Attente du basculement Vercel (15 minutes max)"
SECURE_PUBLIC=false
for _ in $(seq 1 180); do
  HEADERS="$(mktemp)"
  CODE="$(curl -sS --max-time 12 -D "$HEADERS" -o /dev/null -w '%{http_code}' https://cortexlab.online/api/health || true)"
  if [[ "$CODE" == "200" ]] && grep -qi '^x-content-type-options: *nosniff' "$HEADERS"; then
    SECURE_PUBLIC=true
    rm -f "$HEADERS"
    break
  fi
  rm -f "$HEADERS"
  sleep 5
done

[[ "$SECURE_PUBLIC" == "true" ]] || fail "Vercel n'a pas basculé vers la canary sécurisée dans le délai. Aucun changement n'a été appliqué au process principal."

ok "Vercel utilise bien Funnel HTTPS + l'API sécurisée"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
cp .env ".env.pre-secure-${STAMP}"
chmod 600 ".env.pre-secure-${STAMP}"
mv "$SECURE_ENV" .env
chmod 600 .env

log "Bascule du vrai cortex-api sur loopback:${API_PORT_VALUE}"
pm2 restart cortex-api --update-env >/dev/null

MAIN_HEALTH="http://127.0.0.1:${API_PORT_VALUE}/api/health"
for _ in $(seq 1 30); do
  if curl -fsS --max-time 5 -H "Authorization: Bearer $TOKEN" "$MAIN_HEALTH" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 5 -H "Authorization: Bearer $TOKEN" "$MAIN_HEALTH" >/dev/null \
  || { pm2 logs cortex-api --lines 100 --nostream >&2 || true; fail "Le process principal sécurisé n'est pas sain"; }

UNAUTH_MAIN="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "$MAIN_HEALTH" || true)"
[[ "$UNAUTH_MAIN" == "401" ]] || fail "Le process principal n'impose pas l'authentification (HTTP $UNAUTH_MAIN)"

log "Funnel bascule de la canary vers le vrai cortex-api"
tailscale funnel --bg --yes --https=8443 "127.0.0.1:${API_PORT_VALUE}" >/dev/null
sleep 2
curl -fsS --max-time 15 https://cortexlab.online/api/health >/dev/null \
  || fail "Le health public a échoué après le cutover"

cleanup_canary
trap - EXIT

if command -v ufw >/dev/null 2>&1; then
  log "Suppression des règles UFW liées au port public ${API_PORT_VALUE}"
  mapfile -t UFW_RULES < <(ufw status numbered 2>/dev/null | awk -v p="$API_PORT_VALUE" '$0 ~ p {gsub(/\[|\]/,"",$1); if ($1 ~ /^[0-9]+$/) print $1}' | sort -rn)
  for rule in "${UFW_RULES[@]:-}"; do
    [[ -n "$rule" ]] && yes | ufw delete "$rule" >/dev/null 2>&1 || true
  done
fi

if ss -ltn 2>/dev/null | grep -Eq "(^|[[:space:]])(0\.0\.0\.0|\[::\]):${API_PORT_VALUE}([[:space:]]|$)"; then
  fail "Le port ${API_PORT_VALUE} écoute encore publiquement"
fi

pm2 save >/dev/null 2>&1 || true

ok "SECURITY CUTOVER COMPLETE"
printf '%-24s %s\n' "API bind:" "127.0.0.1:${API_PORT_VALUE}"
printf '%-24s %s\n' "HTTPS origin:" "$FUNNEL_ORIGIN"
printf '%-24s %s\n' "Auth directe sans token:" "401"
printf '%-24s %s\n' "Public cortexlab.online:" "200"
printf '%-24s %s\n' "UFW ${API_PORT_VALUE}:" "closed"

cat <<EOF

============================================================
DERNIER SETUP UI POUR LES DEPLOYS AUTOMATIQUES GITHUB
============================================================
Dans GitHub → Cortex-Lab → Settings → Secrets and variables → Actions,
ajoute ces secrets :

1) CORTEX_VPS_SSH_KEY
--- COPIE LE BLOC COMPLET CI-DESSOUS ---
$(cat "$DEPLOY_KEY")
--- FIN DU BLOC ---

2) TS_OAUTH_CLIENT_ID
3) TS_OAUTH_SECRET

Pour les 2 valeurs Tailscale : crée une fois un OAuth client dans l'admin Tailscale,
autorisé à créer des auth keys pour le tag tag:ci, puis colle ses identifiants ici.

Quand les 3 secrets GitHub sont posés, dis simplement « secrets posés » dans ChatGPT.
Aucune autre commande VPS ne sera nécessaire pour activer les deploys automatiques.
============================================================
EOF
