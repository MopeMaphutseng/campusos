#!/bin/bash
# CampusOS Launcher
# Starts the backend + frontend servers and opens the app in the browser.
# Safe to run multiple times - already-running servers are left alone.

BACKEND_DIR="/home/dell/campusos/backend"
FRONTEND_DIR="/home/dell/campusos/frontend/build/web"
LOG_DIR="/tmp/campusos"
FRONTEND_PORT=8082
BACKEND_PORT=3005
API_URL="http://localhost:$BACKEND_PORT"
APP_URL="http://localhost:8082"

mkdir -p "$LOG_DIR"

log() { echo "[CampusOS] $*"; }

# --- Start backend (background, logged) if not already running ---
# Verify it is *CampusOS* (Swagger is the fingerprint), not just any server on the port.
is_campusos_up() {
  curl -s -m 2 "http://localhost:$BACKEND_PORT/docs-json" 2>/dev/null | grep -q '"CampusOS API"'
}
if curl -s -o /dev/null -m 2 "http://localhost:$BACKEND_PORT" 2>/dev/null; then
  if [ -n "$(curl -s -m 2 http://localhost:$BACKEND_PORT/docs-json 2>/dev/null | grep -o 'CampusOS API')" ]; then
    log "Backend already running on :$BACKEND_PORT"
  else
    log "WARNING: port $BACKEND_PORT is in use by another app. Stop it or change PORT."
  fi
else
  log "Starting backend on :$BACKEND_PORT (logs: $LOG_DIR/backend.log)..."
  cd "$BACKEND_DIR"
  PORT=$BACKEND_PORT nohup node dist/main.js >> "$LOG_DIR/backend.log" 2>&1 &
fi

# --- Start frontend server (background, logged) if not already running ---
if curl -s -o /dev/null -m 2 "http://localhost:$FRONTEND_PORT" 2>/dev/null; then
  log "Frontend already running on :$FRONTEND_PORT"
else
  log "Starting frontend server on :$FRONTEND_PORT (logs: $LOG_DIR/frontend.log)..."
  nohup python3 /home/dell/campusos/campusos_server.py "$FRONTEND_PORT" "$FRONTEND_DIR" >> "$LOG_DIR/frontend.log" 2>&1 &
fi

# --- Best-effort: open a terminal window showing live backend logs ---
if [ -n "$DISPLAY" ]; then
  x-terminal-emulator -e bash -c "echo '=== CampusOS Backend ==='; tail -f '$LOG_DIR/backend.log'" >/dev/null 2>&1 &
fi

# --- Wait for backend ---
log "Waiting for backend..."
for i in $(seq 1 45); do
  if curl -s -o /dev/null -m 2 "http://localhost:$BACKEND_PORT/docs-json" 2>/dev/null; then
    log "Backend is ready."
    break
  fi
  sleep 1
done

# --- Wait for frontend ---
log "Waiting for frontend..."
for i in $(seq 1 30); do
  if curl -s -o /dev/null -m 2 "http://localhost:$FRONTEND_PORT" 2>/dev/null; then
    log "Frontend is ready."
    break
  fi
  sleep 1
done

# --- Open the app in the browser ---
log "Opening $APP_URL in your browser..."
xdg-open "$APP_URL" >/dev/null 2>&1 &
log "Done."
