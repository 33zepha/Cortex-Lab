#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

cd "${REPO_ROOT}"

NPM_CACHE_DIR="/tmp/cortexlab-npm-cache"
mkdir -p "${NPM_CACHE_DIR}"

if [ -z "${PLAYWRIGHT_BROWSERS_PATH:-}" ]; then
  if [ -d /workspace ] && [ -w /workspace ]; then
    PLAYWRIGHT_BROWSERS_PATH="/workspace/.cache/cortexlab-playwright"
  else
    PLAYWRIGHT_BROWSERS_PATH="${REPO_ROOT}/.codex/playwright-browsers"
  fi
fi

if [ "${PLAYWRIGHT_BROWSERS_PATH}" != "0" ]; then
  mkdir -p "${PLAYWRIGHT_BROWSERS_PATH}"
fi
export PLAYWRIGHT_BROWSERS_PATH

echo "[cortex] preparing Node dependencies"
npm ci --cache "${NPM_CACHE_DIR}" --prefer-offline --no-audit --no-fund

browser_is_ready() {
  node --input-type=module <<'NODE'
import { chromium } from "playwright";

try {
  const browser = await chromium.launch({ headless: true });
  await browser.close();
} catch {
  process.exit(1);
}
NODE
}

install_browser_only() {
  if ! npx playwright install chromium; then
    echo "[cortex] Playwright Chromium download failed; check setup-script internet access" >&2
    return 1
  fi
}

if browser_is_ready; then
  echo "[cortex] Playwright Chromium is already usable"
else
  echo "[cortex] installing Playwright Chromium"

  # The cloud universal image normally already contains the system libraries.
  # Try the complete install when apt is usable, then fall back to the browser
  # download alone for restricted local/worktree environments.
  if command -v apt-get >/dev/null 2>&1 && [ "$(id -u)" -eq 0 ]; then
    if ! npx playwright install --with-deps chromium; then
      echo "[cortex] system dependency installation was unavailable; retrying browser-only install"
      install_browser_only
    fi
  else
    install_browser_only
  fi
fi

if ! browser_is_ready; then
  echo "[cortex] Chromium is installed but cannot launch in this environment" >&2
  exit 1
fi

echo "[cortex] environment ready"
