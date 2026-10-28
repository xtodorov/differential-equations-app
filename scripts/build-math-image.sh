#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Host download honors the host's existing trusted certificate configuration.
# Both download and container installation verify every pinned artifact hash.
python3 -m pip download --cache-dir "$PWD/.local/pip-cache" \
  --require-hashes --only-binary=:all: -r services/math/requirements.lock \
  -d services/math/.wheelhouse
BUILDX_CONFIG="${BUILDX_CONFIG:-$PWD/.local/buildx}" docker build -t mathforge-math services/math
