# ContainPoint

**SPCC Compliance System of Record** — A production-quality B2B compliance SaaS for qualified Tier I and Tier II facilities.

## Tech stack

- **Next.js 16** with TypeScript, App Router
- **Tailwind CSS** for styling
- **PostgreSQL** with **Prisma 7** ORM
- **NextAuth v5** (credentials provider)
- **Zod** for validation
- **React Hook Form** for forms

## Getting started

### Prerequisites

- Node.js 18+
- PostgreSQL (or use [Prisma's local Postgres](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases) with `npx prisma dev`)

### Database setup

**Option A: Standard PostgreSQL**

1. Create a database: `createdb containpoint`
2. Set in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/containpoint"
   ```

**Option B: Prisma Postgres (local dev)**

1. Run `npx prisma dev` to start local Postgres
2. Use the `DATABASE_URL` from the output (or the one in `.env` if already configured)

### Environment variables

Copy `.env.example` to `.env` and configure:

- `DATABASE_URL` — PostgreSQL connection string (must use `postgresql://` for the app; Prisma migrations support `prisma+postgres://` for Prisma dev)
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`
- `AUTH_URL` — e.g. `http://localhost:3000`

### Install and run

```bash
npm install
npx prisma migrate dev   # Create tables
npm run db:seed          # Seed oil types and demo user
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

After seeding:

- **Email:** admin@containpoint.com
- **Password:** demo1234

## Phase 1 scope

- ✅ App shell with sidebar, top bar, facility switcher
- ✅ Authentication (credentials) and organizations
- ✅ Role-based access (ORG_ADMIN, FACILITY_MANAGER, INSPECTOR, REVIEWER, READ_ONLY_AUDITOR)
- ✅ Facilities and facility membership
- ✅ Applicability + qualification wizard (5 steps)
- ✅ Facility master record / profile
- ✅ Asset registry (list, create, edit, details)
- ✅ Containment registry (list, create, edit, details)
- ✅ Basic file attachments (facility-level)
- ✅ Audit logging for key events
- ✅ Dashboard with real data

## Assumptions

- **Database:** Standard PostgreSQL; Prisma 7 requires `@prisma/adapter-pg` and `postgresql://` URL for runtime.
- **File storage:** Local filesystem (`./uploads`) in development; abstraction allows S3/R2 later.
- **Roles:** ORG_ADMIN sees all facilities; others see only assigned facilities.
- **Tenancy:** Explicit facility membership; no cross-facility data leakage.

## Recommended Phase 2 steps

1. **Inspections engine** — Templates, scheduled inspections, execution with signed records
2. **Corrective actions** — Workflow from failed inspection items
3. **Training & annual briefings** — Personnel records, events, signoffs
4. **5-year review workflow** — Amendment tracking, plan versioning
5. **Audit pack / export center** — PDF generation, ZIP bundles
6. **Asset–containment linking UI** — Full CRUD for links in asset form
7. **File downloads** — Serve uploaded files via API
8. **Facility membership management** — Add/remove users, assign roles
