#!/bin/sh
set -e

echo "[start] Running database migrations + seed (idempotent)..."
node dist/database/seeds/seed.js || echo "[start] Seed step failed; starting API anyway"

if [ "${IMPORT_MATERIALS:-true}" = "true" ]; then
  echo "[start] Importing bundled academic materials (idempotent)..."
  node scripts/import-material-manifest.mjs || echo "[start] Material import failed; starting API anyway"
fi

echo "[start] Starting CampusOS API..."
exec node dist/main.js
