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
| GET /api/v1/academics/timetable | 200 (filtered to enrolled courses) |
| GET /api/v1/academics/timetable/my | 200 |
| GET /api/v1/academics/performance/summary | 200 (credit-weighted GPA) |
| GET /api/v1/academics/enrollments/:id/grades | 200 |
| GET /api/v1/academics/materials | 200 (enrolled courses; `?courseId=&category=&search=`) |
| GET /api/v1/academics/courses/:courseId/materials | 200 |
| POST /api/v1/academics/materials | 201 |
| POST /api/v1/academics/materials/:id/download | 201 (increments counter) |
| GET /api/v1/library/items | 200 |
| GET /api/v1/marketplace/listings | 200 |
| GET /api/v1/messaging/conversations | 200 |
| GET /api/v1/mentorship/mentors | 200 |
| GET /api/v1/scholarships | 200 |
| GET /api/v1/jobs | 200 |
| GET /api/v1/innovation-hub/projects | 200 |
| GET /api/v1/research-hub/calls | 200 |
| GET /api/v1/campus-life/map/locations | 200 |
| GET /api/v1/campus-life/cafeteria/menu | 200 (daily, `?date=&mealType=&shopId=`) |
| GET /api/v1/campus-life/cafeteria/menu/week | 200 (next 7 days) |
| GET /api/v1/campus-life/transport | 200 (paginated routes) |
| GET /api/v1/campus-life/transport/:id/live | 200 (simulated live position + per-stop ETAs) |
| GET /api/v1/notifications/unread-count | 200 (`{count}`) |
| PATCH /api/v1/notifications/:id/read | 200 |
| PATCH /api/v1/notifications/read-all | 200 |
| POST /api/v1/notifications/fcm-token | 200 (persists to `device_tokens`) |
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

## Offline-first (Frontend)
- Hive boxes: `academic_cache`, `campus_cache`, `offline_queue` (initialized in `main.dart` via `HiveStorage.init()`).
- `ApiService.getMyEnrollments()`, `getMyTimetable()`, and `getPerformanceSummary()` are cache-first: they write to Hive on success and fall back to the cached copy on network failure. Cache access is best-effort and never throws into the UI.
- Web-only file uploads live in `lib/core/utils/file_picker_{helper,web,stub}.dart` using conditional imports so the VM test runner does not pull in `dart:html`.

## Navigation
- Tab navigation uses `StatefulShellRoute.indexedStack` (GoRouter). Browser URLs, back/forward and deep links now reflect `/`, `/academics`, `/library`, `/marketplace`, `/messages`.

## Schema & Migrations
- `render.yaml` runs migrations (`DB_SYNCHRONIZE=false`, `DB_MIGRATIONS_RUN=true`).
- ALL migrations are idempotent: `CREATE TABLE/INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, and enums wrapped in `DO $$ BEGIN ... EXCEPTION WHEN duplicate_object`.
- Always add an idempotent migration for any new entity (e.g. `1700000000009-AddCafeteriaMenus`, `1700000000010-AddDeviceTokens`, `1700000000011-AddCourseMaterials`, `1700000000012-EnsureAcademicColumns`); the backend auto-runs them on boot (`migrationsRun` defaults true unless `DB_MIGRATIONS_RUN=false`).
- `012-EnsureAcademicColumns` is additive: it back-fills `courses.level/max_capacity/academic_year/instructor_id/status/prerequisites/metadata` and `enrollments.section/letter_grade/completed_at/metadata/deleted_at`, which earlier environments only had via a `synchronize` run.
- Migrations are **non-destructive** and safe to replay on an existing DB: migration `003` no longer creates the `notifications`/`messages`/`conversations`/`credentials` stubs; `004` creates the real tables with `CREATE TABLE IF NOT EXISTS` and no longer issues `DROP TABLE`.
- Validated by replaying all 12 migrations twice against a throwaway schema (fresh pass + idempotent re-run) and by a data-preservation test (insert university/user/conversation/message/notification → re-run all migrations → all rows survive).

## Academic Materials (first semester import)
- `CourseMaterial` entity (`course_materials`): `courseId`, `courseCode`, `title`, `category`, `fileName`, `fileUrl`, `mimeType`, `sizeBytes`, `checksum`, `uploadedBy`, `downloadCount`. Categories: `lectures, notes, readings, labs, tutorials, assignments, past_papers, projects, code, images, course_info, other`.
- Files are served statically from `backend/uploads/academics/<CODE>/<category>/<file>` at `/uploads/...` (`main.ts` `useStaticAssets`). `backend/uploads/` is gitignored runtime data. `/uploads/` sets `Access-Control-Allow-Origin: *` and `Cross-Origin-Resource-Policy: cross-origin` so the web app can embed files.
- `scripts/import-first-semester.mjs` is idempotent: creates/updates courses, enrols the demo student, copies curated files, and inserts rows (SHA-256 dedupe + unique `(university_id, checksum)` index). Use `node scripts/import-first-semester.mjs --dry-run` first.
- Imported 7 real courses (including `CS3400` nested inside `EE3400`): `CS3520 Computer Systems`, `CS3541 Computer Networks`, `CS3400 Data Structures and Algorithms`, `EE3400 Electronic Measurements and Instrumentation`, `EE3404 Electric Circuit Theory`, `EE3408 Analogue Communications`, `M3503 Engineering Mathematics III` — 468 materials / ~505 MB. Windows junk (`Zone.Identifier`, `~$`, `.exe`, `.bkp`), saved Classroom HTML/`_files` caches and 48 duplicate copies are skipped.
- Frontend: `Academics → Materials` tab (`academics_screen.dart`) groups by course, sorts by category, and searches title/course/file. Tapping a material pushes `MaterialViewerScreen`, which previews PDFs/images/text/code in an embedded `HtmlElementView` iframe on web (`lib/core/widgets/file_preview_web.dart`, with a conditional-import stub for VM tests). Office/CAD/zip files show an in-app fallback with an "Open file" action.

## P1 Campus Features
- **Cafeteria menu + ordering**: `CafeteriaMenu` entity (`cafeteria_menus`), daily + weekly endpoints, seeded 7 days. Frontend `features/campus-life/cafeteria/cafeteria_screen.dart` reads `cafeteriaMenuProvider`, supports a cart (FAB → bottom sheet) and places real orders via `POST /campus-life/cafeteria/orders` (`CafeteriaOrder`, total auto-computed). `GET /campus-life/cafeteria/orders` lists your orders. **Orders are priced server-side**: clients send `{items:[{menuItemId, quantity}]}`; the backend resolves name/price from `cafeteria_menus` (scoped to university, `isAvailable=true`), ignores any client price, rejects unknown/unavailable items and invalid quantities, and derives `cafeteriaName`/`currency`/`totalAmount`. Covered by `__tests__/cafeteria-order.service.spec.ts`.
- **Shuttle tracker**: `TransportRoute` seeded (C1/R1/T1). `/transport/:id/live` simulates the bus gliding along the route polyline (5-min loop, server clock) and returns distance + ETA per stop. Frontend `transport_screen.dart` polls `shuttleLiveProvider` every 10s.
- **Notifications**: `DeviceToken` entity (`device_tokens`) persists FCM tokens (uniq per token, soft-deactivate on remove/invalid). In-app center shows unread badge (`unreadNotificationsCountProvider`) on the dashboard bell; field is `read` (backend) — the provider tolerates `read`/`isRead`.

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
