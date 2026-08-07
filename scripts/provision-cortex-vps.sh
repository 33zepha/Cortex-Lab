#!/usr/bin/env bash
set -Eeuo pipefail

HOSTNAME="${1:-api.cortexlab.online}"
TUNNEL_NAME="${CORTEX_TUNNEL_NAME:-cortex-api}"
API_PORT="${API_PORT:-4000}"
STATE_DIR="/etc/cortex"
ENV_FILE="$STATE_DIR/cortex-api.env"
TUNNEL_ID_FILE="$STATE_DIR/cloudflared-tunnel-id"
CLOUDFLARED_CONFIG="/etc/cloudflared/config.yml"

log() { printf '\n\033[1;36m[cortex]\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m[cortex]\033[0m %s\n' "$*" >&2; exit 1; }

[[ "${EUID}" -eq 0 ]] || fail "Relance avec sudo: sudo bash scripts/provision-cortex-vps.sh $HOSTNAME"
command -v git >/dev/null || fail "git est requis"

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
[[ -n "$REPO_ROOT" && -f "$REPO_ROOT/package.json" ]] || fail "Lance ce script depuis le checkout Cortex-Lab sur le VPS"

log "Préparation du runtime Cortex dans $REPO_ROOT"
install -d -m 700 "$STATE_DIR"

# Keep the long-lived API secret outside the repository. Re-running the script keeps the same token.
if [[ ! -f "$ENV_FILE" ]]; then
  API_TOKEN="$(openssl rand -hex 32)"
  cat >"$ENV_FILE" <<EOF
CORTEX_API_TOKEN=$API_TOKEN
API_BIND_HOST=127.0.0.1
API_PORT=$API_PORT
CORTEX_ALLOWED_ORIGINS=https://cortexlab.online
EOF
  chmod 600 "$ENV_FILE"
else
  API_TOKEN="$(sed -n 's/^CORTEX_API_TOKEN=//p' "$ENV_FILE" | head -n1)"
  [[ -n "$API_TOKEN" ]] || fail "$ENV_FILE existe mais ne contient pas CORTEX_API_TOKEN"
fi

# Install Node dependencies only when the API runner is not already available.
if [[ ! -x "$REPO_ROOT/node_modules/.bin/tsx" ]]; then
  log "Installation des dépendances Node"
  cd "$REPO_ROOT"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
fi

NPM_BIN="$(command -v npm || true)"
[[ -n "$NPM_BIN" ]] || fail "npm introuvable"
NODE_BIN_DIR="$(dirname "$NPM_BIN")"

log "Installation du service systemd cortex-api"
cat >/etc/systemd/system/cortex-api.service <<EOF
[Unit]
Description=Cortex central API
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
WorkingDirectory=$REPO_ROOT
EnvironmentFile=-$REPO_ROOT/.env
EnvironmentFile=$ENV_FILE
Environment=NODE_ENV=production
Environment=PATH=$NODE_BIN_DIR:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=$NPM_BIN run api
Restart=always
RestartSec=2
TimeoutStopSec=20
KillSignal=SIGTERM
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
LockPersonality=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now cortex-api.service

log "Attente de l'API locale sur 127.0.0.1:$API_PORT"
for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 -H "Authorization: Bearer $API_TOKEN" "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
curl -fsS --max-time 3 -H "Authorization: Bearer $API_TOKEN" "http://127.0.0.1:$API_PORT/api/health" >/dev/null \
  || { journalctl -u cortex-api.service -n 60 --no-pager >&2; fail "L'API Cortex locale ne répond pas"; }

if ! command -v cloudflared >/dev/null; then
  log "Installation de cloudflared"
  apt-get update -qq
  apt-get install -y -qq ca-certificates curl
  ARCH="$(dpkg --print-architecture)"
  case "$ARCH" in
    amd64|arm64) ;;
    *) fail "Architecture cloudflared non gérée automatiquement: $ARCH" ;;
  esac
  TMP_DEB="$(mktemp --suffix=.deb)"
  curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${ARCH}.deb" -o "$TMP_DEB"
  dpkg -i "$TMP_DEB"
  rm -f "$TMP_DEB"
fi

install -d -m 700 /root/.cloudflared /etc/cloudflared
if [[ ! -f /root/.cloudflared/cert.pem ]]; then
  log "Authentification Cloudflare requise une seule fois"
  echo "Ouvre l'URL affichée par cloudflared, connecte-toi à Cloudflare et autorise la zone cortexlab.online."
  cloudflared tunnel login
fi

if [[ -f "$TUNNEL_ID_FILE" ]]; then
  TUNNEL_ID="$(cat "$TUNNEL_ID_FILE")"
else
  log "Création du tunnel nommé $TUNNEL_NAME"
  CREATE_OUTPUT="$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1 | tee /dev/stderr)"
  TUNNEL_ID="$(printf '%s\n' "$CREATE_OUTPUT" | grep -Eo '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}' | tail -n1 || true)"
  [[ -n "$TUNNEL_ID" ]] || fail "Impossible de récupérer l'identifiant du tunnel"
  printf '%s\n' "$TUNNEL_ID" >"$TUNNEL_ID_FILE"
  chmod 600 "$TUNNEL_ID_FILE"
fi

CREDENTIALS_FILE="/root/.cloudflared/${TUNNEL_ID}.json"
[[ -f "$CREDENTIALS_FILE" ]] || fail "Credentials Cloudflare introuvables: $CREDENTIALS_FILE"

log "Configuration de $HOSTNAME -> http://127.0.0.1:$API_PORT"
cat >"$CLOUDFLARED_CONFIG" <<EOF
tunnel: $TUNNEL_ID
credentials-file: $CREDENTIALS_FILE
protocol: quic
ingress:
  - hostname: $HOSTNAME
    service: http://127.0.0.1:$API_PORT
  - service: http_status:404
EOF
chmod 600 "$CLOUDFLARED_CONFIG"

# This command is safe to retry when the route already points at the same tunnel.
cloudflared tunnel route dns "$TUNNEL_ID" "$HOSTNAME" || true

if systemctl list-unit-files cloudflared.service >/dev/null 2>&1; then
  systemctl restart cloudflared.service
else
  cloudflared --config "$CLOUDFLARED_CONFIG" service install
  systemctl enable --now cloudflared.service
fi
systemctl enable cloudflared.service >/dev/null 2>&1 || true

log "Vérification du tunnel HTTPS"
PUBLIC_OK=0
for _ in $(seq 1 30); do
  if curl -fsS --max-time 4 -H "Authorization: Bearer $API_TOKEN" "https://$HOSTNAME/api/health" >/dev/null 2>&1; then
    PUBLIC_OK=1
    break
  fi
  sleep 2
done

if [[ "$PUBLIC_OK" -ne 1 ]]; then
  systemctl --no-pager --full status cloudflared.service || true
  fail "Le tunnel est installé mais https://$HOSTNAME/api/health ne répond pas encore. Vérifie que cortexlab.online est bien géré par le compte Cloudflare autorisé."
fi

log "Cortex API centrale opérationnelle"
printf '\n%-24s %s\n' "API origin:" "https://$HOSTNAME"
printf '%-24s %s\n' "API local:" "http://127.0.0.1:$API_PORT"
printf '%-24s %s\n' "cortex-api:" "$(systemctl is-active cortex-api.service)"
printf '%-24s %s\n' "cloudflared:" "$(systemctl is-active cloudflared.service)"
printf '\nAjoute maintenant dans Vercel (Preview + Production):\n'
printf '  CORTEX_API_ORIGIN=https://%s\n' "$HOSTNAME"
printf '  CORTEX_API_TOKEN=<valeur stockée dans %s>\n' "$ENV_FILE"
printf '\nPour afficher le token directement sur le VPS (ne le colle pas dans un chat):\n'
printf "  sudo sed -n 's/^CORTEX_API_TOKEN=//p' %s\n" "$ENV_FILE"
