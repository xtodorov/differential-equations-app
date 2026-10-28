# MathForge AI

A Bulgarian mathematics and Wolfram Language learning MVP. The first student journey works independently of paid AI, Stripe, or a Wolfram license. This repository was built from an empty checkout.

## Implemented

- Next.js App Router, React, TypeScript, Tailwind, shadcn-style Radix/CVA button, Lucide icons, KaTeX, Plotly, and locally served Monaco editor assets.
- Registration, login, logout, scrypt password hashing, opaque database sessions with hashed tokens, HttpOnly/SameSite cookies, same-origin mutation checks, Zod validation, request-size bounds, basic in-process rate limiting, and server-side ownership checks.
- Bulgarian onboarding with preparation level, prior topics, university subject, optional exam date, desired grade, and study time. The dashboard recommends a starting lesson based on preparation and unresolved mistakes; every lesson remains accessible.
- PostgreSQL with Prisma's JavaScript PostgreSQL adapter; seven relational models, indexes, cascading user data, a versioned SQL migration, and an idempotent content seed.
- **23 Bulgarian lessons / 69 exercises**: 3 foundations, 3 calculus, 3 first-order ODE, 2 second-order ODE, 1 modeling, 3 beginner Wolfram, 3 symbolic Wolfram, 3 Wolfram ODE, 2 combined lessons. Theory, objectives, worked steps, common mistakes, three hints, and explicit solution reveal.
- Symbolic mathematics verification through a separate FastAPI/SymPy service. A restricted AST grammar avoids Python `eval` and SymPy `parse_expr`; requests execute in short-lived processes with CPU, memory, time, and concurrency bounds. Real continuous domains must match before equivalence is accepted.
- Wolfram Practice Mode: deterministic token comparison with specific curated answers, balanced brackets, casing, and token boundaries. Whitespace is ignored; algebraic or arbitrary code equivalence is **not** promised. No Wolfram code executes. The connected provider explicitly reports unavailable.
- Persisted exercise attempts, solved lesson status, mistake review, streaks, study-session timestamps, dashboard goals, and resume after logout/login.
- Light/dark themes, mobile navigation, accessible basic code textarea alongside Monaco, and an interactive analytic graph laboratory for exponential change, cooling, and oscillation.

## Run locally

Prerequisites: Node.js 24+, npm, Python 3.12, `uv`, Docker with Compose. No external credentials are needed for the local learning workflow.

```bash
cp .env.example .env             # only if .env does not already exist
./scripts/setup.sh
./scripts/start-services.sh      # PostgreSQL, migration, content seed
```

In separate terminals from the repository root:

```bash
.venv/bin/uvicorn main:app --app-dir services/math --host 127.0.0.1 --port 8001 --limit-concurrency 12
npm run dev
```

The web application uses port 3000. Register your own account; there are no default student/admin credentials. In production, use `npm run build` then `npm run start` instead of `npm run dev`.

`docker compose up -d --build math` is an alternative to the Python terminal. The math container is nonroot, has a read-only filesystem, reduced capabilities, and resource limits. The host Python process is the default cloud workflow. For cloud/proxy environments where Docker cannot reach PyPI, run `./scripts/build-math-image.sh` first (host Python 3.12 with pip). It downloads locked wheels using the host trust configuration and builds the container offline; the image does not contain the host CA bundle. Keep the wheel cache matched to the target Python/platform.

The `db` Compose service uses a persistent Docker volume. `scripts/start-services.sh` reuses the known `mathforge-postgres` container if present. Do not use `docker compose down -v` unless you intend to delete its database. Docker state/volumes are not assumed to survive a new cloud machine: use a managed database for durable cross-machine student accounts, or separately back up and restore PostgreSQL.

### Environment variables

| Variable            | Purpose                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | Server-only PostgreSQL URL. Local development value is in `.env.example`; use a dedicated least-privilege credential in deployment.                           |
| `MATH_SERVICE_URL`  | Private FastAPI origin, default `http://127.0.0.1:8001`. Do not expose this service publicly.                                                                 |
| `APP_ORIGIN`        | Exact browser origin for mutation checks and secure-cookie configuration. Local default `http://localhost:3000`; use the deployed HTTPS origin in production. |
| `POSTGRES_PASSWORD` | Optional Compose password override; update `DATABASE_URL` to match. Initializing an existing volume does not change its existing password.                    |
| `CHROMIUM_PATH`     | Browser test executable. Defaults to the cloud's `/usr/bin/chromium`.                                                                                         |

Never put database or provider credentials in `NEXT_PUBLIC_*` variables or commit `.env`.

### Prisma in a restricted environment

The standard Prisma CLI eagerly downloads a native schema engine from `binaries.prisma.sh`, which this cloud instance blocks. This project instead uses the version-pinned Prisma in-process JS client generator (`npm run db:generate`), the official PostgreSQL adapter, and a transactional SQL migration runner (`npm run db:migrate`). Package integrity and TLS checks remain enabled.

The migration runner uses an advisory lock, applies SQL atomically, records Prisma-compatible migration history/checksums, rejects tampered history, and never resets the database. For future schema changes, author and review a new SQL migration alongside the Prisma schema; do not edit an applied migration. Test schema changes on a fresh database and an existing database. The generator uses Prisma internal packages pinned to the same version: upgrade them together and rerun the full suite.

## Validation

With the database, math service, and built Next.js application running:

```bash
npm test                         # Wolfram validator and curriculum integrity
npm run test:math                 # SymPy equivalence/domain/input safety
npm run test:db                   # disposable DB; needs CREATEDB in local dev
npm run lint                     # TypeScript check
npm run build                    # production bundle
npm run test:e2e                  # real Chromium student journey + security/mobile checks
```

For a machine without Chromium, install a Playwright browser through your package/network policy and set `CHROMIUM_PATH` to its executable. Browser downloads are not necessary in the supplied cloud image. The e2e tests create uniquely named student accounts in the configured development database. Use a dedicated test database outside local development. Do not run builds while the production server is serving the same `.next` output; restart it after a build.

## Project map

```text
src/app/                  Layout, routes, server API, Bulgarian design system
src/components/           Dashboard, onboarding, lessons, exercises, Monaco, Plotly
src/components/ui/        Radix/CVA button primitive
src/lib/                  Database, auth, validation, curriculum seed data
prisma/                   Schema, SQL migration, seed
services/math/            FastAPI + bounded SymPy validation and tests
scripts/                  Setup, assets, portable Prisma generation, migrations
 tests/                   Vitest + Playwright (tests/e2e)
```

## Explicit limitations and next phases

This is the first functional educational milestone, **not a commercially launched SaaS**. The following requested phases remain unimplemented:

- AI professor chat, provider integration, token accounting, and monthly usage quotas. The UI states that AI is unavailable; lesson hints are curated content.
- Stripe checkout, portal, subscription webhooks/entitlements, and mock billing state. No payment endpoint accepts money, and no fake paid plan grants access.
- Secure uploads/PDF/notebook processing, exam simulator, protected content administration, full curriculum beyond the initial 23 lessons, difficulty tiers, spaced repetition, and a complete adaptive prerequisite graph.
- Live licensed Wolfram execution. Adding a backend requires contractual authorization and a separate sandbox with timeout, network/filesystem restrictions, quotas, and concurrency limits. Never execute notebook uploads on the web server.
- Email verification, password reset, account export/deletion UI, MFA, multi-instance rate limits, production telemetry/alerting, and complete GDPR data-retention controls.

Progress dashboard calculations currently inspect the latest 500 attempts (history is labeled accordingly); very long-term mastery/streak aggregation needs dedicated database queries before launch. Study sessions store start/end timestamps but do not claim precise engaged study time. Browser closures may leave an unfinished session. Daily exercise goals are fixed at three, separate from the requested study-time preference.

Mathematics input supports real variables `x`, `y`, `pi`, `E`, arithmetic and single-argument `exp`, `sin`, `cos`, `tan`, `log`, `sqrt`, `abs`. Powers, expression length, and AST depth are bounded. Checks compare to curated canonical answers and their real continuous domains; this is not a general ODE theorem prover or checker for arbitrary solution families. ODE exercises use unique initial-value solutions, including explicit zero solutions. Wolfram exercises accept the documented token sequence; other mathematically equivalent programs may be rejected.

## Before commercial launch

Commission mathematical/pedagogical review, especially lesson depth and targeted hints. Complete email/account lifecycle, distributed abuse protection, backup/restore drills, monitoring, accessibility review, and independent security review. Deploy PostgreSQL with backups and TLS, HTTPS for the web app, and a private math service; scope runtime database privileges and separate migration privileges. Do not treat local Docker passwords as production credentials.

Have qualified EU advisers review GDPR legal basis, processor agreements, privacy notices, data access/deletion/retention, consumer withdrawal/cancellation rights, digital-service terms, VAT/OSS invoicing, accessibility obligations, and Wolfram trademark/licensing terms. Student Pro at €9.99/month is a future commercial target, not an active offer.
