# CampusOS — The Operating System for Student Life

> **NYLP AI Hackathon 2026** — Empowering Youth. Building Tomorrow.

| Submission field | Value |
|---|---|
| **Live Demo URL** | [https://campusos-web-lis2.onrender.com](https://campusos-web-lis2.onrender.com) |
| **API Base URL** | [https://campusos-api-36tv.onrender.com](https://campusos-api-36tv.onrender.com) |
| **GitHub Repository** | [https://github.com/MopeMaphutseng/campusos](https://github.com/MopeMaphutseng/campusos) |
| **Demo Video URL** | _TODO — add your 60–90s Loom/Canva link here_ |
| **AI Tools Used** | Google Gemini (`gemini-3.6-flash`), Mistral, NVIDIA NIM — plus AI-assisted development |

**Demo login**

| Role | Email | Password |
|---|---|---|
| Student | `thabo.mokoena@nul.ls` | `CampusOS2024!` |
| Admin | `admin@campusos.ls` | `AdminCampus2026` |

> University ID (required as the `X-University-ID` header): `a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`

---

## 1. Problem

Students at African universities juggle a dozen disconnected services every day: the
LMS, the library, the marketplace, career portals, campus announcements, sports, health
appointments, and more — each with its own login, none aware of what the student actually
studies. Information is not personalised, so a Computer Science student sees the same
scholarships, past papers and events as everyone else, and opportunities get buried.

## 2. Solution

**CampusOS** is a multi-tenant "super-app" that unifies academic, campus-life, marketplace
and career services into a single product with **one login**. Each university is an isolated
tenant, and an **AI Campus Tutor** answers questions grounded in the student's *real* data —
their courses, timetable, grades, library, scholarships and live campus feeds.

An admin console lets staff upload and manage every piece of content (past papers,
scholarships, jobs, news, events, mentors, map locations) and **target it to specific
course codes** — so content reaches exactly the students it is relevant to.

## 3. Features

- **AI Campus Tutor (CampusGPT)** — a chat assistant grounded in live campus context:
  real weather (Open-Meteo), the student's grades and timetable, open scholarships and
  jobs, past exam papers, mentors, events, news and sports. Understands and replies in the
  student's language.
- **Course-aware content targeting** — admins tag content with course codes; students only
  see what matches their enrollment (untargeted content is visible to everyone).
- **Admin console** — sign in as admin, manage 8 content types, upload images/documents,
  create/edit/delete, and set course-code targeting per item.
- **Academics** — courses, grades, timetable, assignments.
- **Library** — past exam papers, textbooks, notes and videos, with per-item AI actions
  (explain, summarise, generate flashcards, citation).
- **Scholarships & Jobs** — curated, deadline-aware opportunity feeds.
- **Marketplace & Food** — buy/sell listings and campus food shops with menus.
- **Campus life** — interactive map, news, events, sports, health appointments.
- **Comms** — messaging, notifications, mentorship.
- **Multi-tenant & secure** — JWT auth, tenant isolation, role-based access (student/admin),
  rate limiting, soft deletes.

## 4. Tech Stack — and For Whom

| Layer | Technology |
|---|---|
| Frontend | Flutter (Web, iOS, Android) |
| Backend | NestJS (TypeScript) |
| Database | PostgreSQL (multi-tenant, TypeORM migrations) |
| Cache | Redis (optional — falls back to in-memory) |
| AI | Google Gemini, Mistral, NVIDIA NIM (OpenAI-compatible) |
| Realtime | Socket.IO, WebSockets |
| Auth | JWT + Passport, bcrypt |
| Hosting | Render (Docker API + static Flutter site + managed Postgres) |

**For whom:** university students (the primary user), university staff/administrators
(content & targeting management), and universities as tenants who want one connected
platform for campus life.

## 5. AI / API Usage

| Model / API | What it does in the app |
|---|---|
| **Google Gemini** (`gemini-3.6-flash`) | Primary AI provider. Powers the Campus Tutor chat, and the per-item library actions (explain / summarise / flashcards / citation). Grounded via a `getCampusContext()` builder that injects the student's live data. |
| **Mistral** | Secondary text provider for the tutor pipeline. |
| **NVIDIA NIM** (OpenAI-compatible) | Automatic fallback provider so the tutor keeps working if the primary hits a rate limit/quota. |
| **Open-Meteo** | Live weather shown in the student dashboard and used by the AI tutor. |
| **Brevo** (HTTP API + SMTP) | Transactional email for 6-digit account-verification and password-reset codes. |
| **Ollama** | Optional local provider for offline development. |

Provider order is configurable via `AI_DEFAULT_PROVIDER`
(`gemini` → `nvidia` → `ollama`). With no key configured the API returns an honest
`400 "All AI providers are currently unavailable"` — it never fabricates an answer.

## 6. Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/MopeMaphutseng/campusos.git
cd campusos
```

### 2. Install dependencies
```bash
# Backend
cd backend && npm install && cd ..

# Frontend (requires the Flutter SDK: https://docs.flutter.dev/get-started/install)
cd frontend && flutter pub get && cd ..
```

Or start PostgreSQL + Redis with Docker:
```bash
docker-compose up -d postgres redis
```

### 3. Add environment variables (do NOT commit real keys)
```bash
cp backend/.env.example backend/.env.development
# then edit backend/.env.development and set:
#   DB_*            (PostgreSQL connection)
#   JWT_SECRET / JWT_REFRESH_SECRET
#   GEMINI_API_KEY  (and/or MISTRAL_API_KEY / NVIDIA_API_KEY)
```
Real `.env*` files are git-ignored. The frontend API URL is set at build time with
`--dart-define=API_BASE_URL=...` (defaults to `http://localhost:3005`).

### 4. Run the app
```bash
# Backend (runs migrations automatically, then serves on :3005)
cd backend && npm run build && npm run start:prod

# Seed demo data (idempotent — safe to re-run)
cd backend && npm run seed

# Frontend
cd frontend && flutter run -d chrome
# or build for web:
flutter build web --release --dart-define=API_BASE_URL=http://localhost:3005
```

The API docs (Swagger) are served at `/docs`. All endpoints require the
`X-University-ID` header (even login).

## 7. Deployment (Render)

This repo includes a [`render.yaml`](./render.yaml) blueprint that provisions everything:

1. Push to GitHub (see repo URL above).
2. On [Render](https://render.com): **New → Blueprint**, select this repository.
3. Render creates the PostgreSQL database, the API (Docker), and the static Flutter site.
   When prompted, paste your **`GEMINI_API_KEY`** (and optionally Mistral/NVIDIA keys).
4. Done — the API runs migrations and seeds demo data on first boot, and the frontend is
   built and published automatically.

> The free tier spins a service down after ~15 minutes of inactivity; the first request
> afterwards takes ~30–60s to wake up.

## 8. Screenshots

Product screenshots (student dashboard, AI Campus Tutor, Study Planner, Business
Assistant, Profile & Analytics, admin console and course-targeted content) are collected
in the project screenshots folder:

> **Google Drive:** _TODO — paste the public "Anyone with the link can view" screenshots
> folder link here before submitting._

Screens captured from the live product:

| | |
|---|---|
| ![](./docs/screenshots/dashboard.png) | ![](./docs/screenshots/tutor.png) |
| ![](./docs/screenshots/admin.png) | ![](./docs/screenshots/targeting.png) |

## 9. Team Contributions

This project was built **solo** by **Maphutseng 'Mope** for the NYLP AI Hackathon 2026.

- **Maphutseng 'Mope** — Solo developer (design, frontend, backend, AI integration, DevOps):
  - Designed and built the full product: Flutter multi-tenant web frontend and NestJS API.
  - Implemented the AI Campus Tutor (grounded context builder, multi-provider pipeline with
    Gemini → NVIDIA NIM fallback, SSE streaming) and the per-item library AI actions.
  - Built the Study Planner, Business Assistant and Profile & Analytics features.
  - Built the admin console and course-code content targeting.
  - Implemented multi-tenant security: JWT auth, tenant isolation, role-based access, and
    6-digit email verification via Brevo.
  - Set up deployment on Render (Docker API, static Flutter site, managed PostgreSQL) and
    the `render.yaml` blueprint.

## 10. Known Limitations

- The AI tutor depends on third-party model quotas; it falls back automatically but can be
  slow (or unavailable) if all provider keys are exhausted.
- Seed data targets one fully-populated demo university (National University of Lesotho);
  other tenants are configured but lightly populated.
- Some payment/SMS/push integrations are scaffolded but not wired to live providers.
- Free hosting tiers cold-start after inactivity and have modest resource limits.
- Redis is optional; without it the app runs on an in-memory cache (single instance only).

## License

Released for the NYLP AI Hackathon 2026. See repository for details.
