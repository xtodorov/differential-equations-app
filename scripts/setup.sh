#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export npm_config_cache="${npm_config_cache:-$PWD/.local/npm-cache}"
export UV_CACHE_DIR="${UV_CACHE_DIR:-$PWD/.local/uv-cache}"
if [[ "$(node -p 'process.versions.node.split(".")[0]')" -lt 24 ]]; then
  echo 'Node.js 24 or newer is required.' >&2
  exit 1
fi
npm ci --no-audit --no-fund
npm run db:generate
npm run assets
uv venv --allow-existing .venv
uv pip sync --require-hashes --python .venv/bin/python services/math/requirements.lock
if [[ ! -f .env ]]; then cp .env.example .env; fi
