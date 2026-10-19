# CampusOS - Agent Runbook

## Quick Start
```bash
# One-click: starts backend (:3005) + frontend (:8082)
bash ~/campusos/campusos-launch.sh

# Frontend build
cd ~/campusos/frontend && ~/flutter/bin/flutter build web --release

# Backend build+start (PORT is read from .env.development -> 3005)
cd ~/campusos/backend && npx nest build -b swc && node dist/main.js

# Frontend server (after build)
cd ~/campusos/frontend/build/web && python3 ~/campusos/campusos_server.py 8082 .
```

**Ports:** backend `3005` (NOT 3000 — `~/adapt-technologies` owns 3000), frontend `8082`.
Frontend API base defaults to `http://localhost:3005`; override at build with
`--dart-define=API_BASE_URL=http://host:port`.

## Test Demo Credentials
- Email: thabo.mokoena@nul.ls
- Password: CampusOS2024!
- University ID: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11

## Backend Endpoints (all 200)
| Endpoint | Status |
|---|---|
| GET /api/v1/auth/login | 200 |
| POST /api/v1/auth/register | 201/200 |
| GET /api/v1/dashboard/today | 200 |
| GET /api/v1/academics/courses | 200 |
| GET /api/v1/library/items | 200 |
| GET /api/v1/marketplace/listings | 200 |
| GET /api/v1/messaging/conversations | 200 |
| GET /api/v1/mentorship/mentors | 200 |
| GET /api/v1/scholarships | 200 |
| GET /api/v1/jobs | 200 |
| GET /api/v1/innovation-hub/projects | 200 |
| GET /api/v1/research-hub/calls | 200 |
| GET /api/v1/campus-life/map/locations | 200 |
| GET /api/v1/health/appointments | 200 |
| GET /api/v1/sports/matches | 200 |
| GET /api/v1/news/articles | 200 |
| GET /api/v1/notifications | 200 |
| GET /api/v1/payments/transactions | 200 |

## Important Architecture Notes
- Multi-tenant: `X-University-ID` header required on ALL requests (even login)
- `TenantGuard` binds the header to the JWT: an authenticated user may only use their own university's ID, else 403. Super-admins are exempt.
- Backend wraps all responses in `{ data: ... }` (ResponseInterceptor)
- All entities extend `TenantBaseEntity` (id, universityId, createdAt, updatedAt, deletedAt)
- TypeORM soft-deletes use `deleted_at` column — must exist on every table
- `synchronize: false`, `migrationsRun: true` — new entities need a migration or they 500 at runtime
- JWT expires in 15 minutes

## AI (CampusGPT)
- Real pipeline: `ai-tutor` module → `AIService` → Claude/Gemini provider. `library/*/ai/*` endpoints delegate to `AIService`.
- Models need a key: set `ANTHROPIC_API_KEY` and/or `GEMINI_API_KEY` in `.env.development`.
  With no key the API returns `400 "All AI providers are currently unavailable"` (honest failure, no fake output).
- Provider selection: `AI_DEFAULT_PROVIDER` (env) → Claude default.
- Endpoints: `POST /api/v1/ai-tutor/sessions`, `POST /api/v1/ai-tutor/sessions/:id/messages`,
  `POST /api/v1/library/items/:id/ai/{explain,summarize,flashcards,citation}`.

## Common Issues & Fixes

### Backend 500: "column X does not exist"
Entity has a column the DB table doesn't. Fix: `ALTER TABLE table ADD COLUMN IF NOT EXISTS column TYPE;` then restart backend.

### Frontend 401 on login
Auth interceptor must set `X-University-ID` header on every request. Check `api_service.dart` interceptor.

### Browser cache issues
- Removed `flutter_service_worker.js` from build/web
- Added no-cache meta tags to `index.html`
- User must `Ctrl+F5` hard refresh
