#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
# Use only this application's known container; preserve any existing data.
if docker container inspect mathforge-postgres >/dev/null 2>&1; then
  docker start mathforge-postgres >/dev/null
else
  docker compose up -d db
fi
for _ in $(seq 1 30); do
  if docker exec mathforge-postgres pg_isready -U mathforge -d mathforge >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec mathforge-postgres pg_isready -U mathforge -d mathforge
npm run db:migrate
npm run db:seed
printf '%s\n' 'Database ready. Start the math service and Next.js in separate terminals (see README.md).'
