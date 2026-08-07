param(
  [Parameter(Mandatory = $true)]
  [string]$VpsHost,

  [string]$VpsUser = "root"
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$DataRoot = Join-Path $RepoRoot "data"
$Required = @("missions", "ledger", "evidence")

foreach ($name in $Required) {
  $path = Join-Path $DataRoot $name
  if (-not (Test-Path $path)) {
    throw "Dossier local manquant: $path"
  }
}

$RealFiles = Get-ChildItem -Path (Join-Path $DataRoot "missions") -File -Recurse |
  Where-Object { $_.Name -ne ".gitkeep" }
if ($RealFiles.Count -eq 0) {
  throw "Aucune mission réelle trouvée dans data/missions sur ce PC. Rien à migrer."
}

foreach ($cmd in @("tar", "ssh", "scp")) {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
    throw "$cmd est requis. Active le client OpenSSH Windows si nécessaire."
  }
}

$Stamp = [DateTime]::UtcNow.ToString("yyyyMMddTHHmmssZ")
$Archive = Join-Path $env:TEMP "cortex-data-$Stamp.tar.gz"
$RemoteArchive = "/tmp/cortex-data-$Stamp.tar.gz"
$Target = "$VpsUser@$VpsHost"

Write-Host "[cortex] Création de l'archive locale..."
Push-Location $RepoRoot
try {
  & tar -czf $Archive "data/missions" "data/ledger" "data/evidence"
  if ($LASTEXITCODE -ne 0) { throw "tar a échoué" }
}
finally {
  Pop-Location
}

try {
  Write-Host "[cortex] Upload chiffré SSH vers $Target..."
  & scp $Archive "${Target}:$RemoteArchive"
  if ($LASTEXITCODE -ne 0) { throw "scp a échoué" }

  $RemoteScript = @'
set -Eeuo pipefail
IMPORT_ARCHIVE="$1"
[[ -f /etc/cortex/repo-root ]] || { echo "Provisionne d'abord le VPS avec scripts/provision-cortex-vps.sh" >&2; exit 1; }
REPO_ROOT="$(cat /etc/cortex/repo-root)"
[[ -d "$REPO_ROOT/data" ]] || { echo "Dossier data introuvable: $REPO_ROOT/data" >&2; exit 1; }

TOKEN="$(sed -n 's/^CORTEX_API_TOKEN=//p' /etc/cortex/cortex-api.env | head -n1)"
[[ -n "$TOKEN" ]] || { echo "CORTEX_API_TOKEN introuvable" >&2; exit 1; }

systemctl stop cortex-api.service
/usr/local/sbin/cortex-backup || true

rm -rf "$REPO_ROOT/data/missions" "$REPO_ROOT/data/ledger" "$REPO_ROOT/data/evidence"
tar -xzf "$IMPORT_ARCHIVE" -C "$REPO_ROOT"
rm -f "$IMPORT_ARCHIVE"

systemctl start cortex-api.service
for _ in $(seq 1 20); do
  if curl -fsS --max-time 2 -H "Authorization: Bearer $TOKEN" http://127.0.0.1:4000/api/health >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done
journalctl -u cortex-api.service -n 60 --no-pager >&2
exit 1
'@

  Write-Host "[cortex] Backup VPS, import atomique et redémarrage de l'API..."
  $RemoteScript | & ssh $Target "bash -s -- '$RemoteArchive'"
  if ($LASTEXITCODE -ne 0) { throw "La migration distante a échoué" }

  Write-Host "[cortex] Migration terminée. Les missions du PC sont maintenant la source de vérité sur le VPS."
}
finally {
  Remove-Item $Archive -Force -ErrorAction SilentlyContinue
}
