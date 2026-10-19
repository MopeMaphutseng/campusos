#!/bin/sh
set -e

echo "[start] Running database migrations + seed (idempotent)..."
node dist/database/seeds/seed.js || echo "[start] Seed step failed; starting API anyway"

echo "[start] Starting CampusOS API..."
exec node dist/main.js
