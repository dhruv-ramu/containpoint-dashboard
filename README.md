# ContainPoint

**SPCC Compliance System of Record** — A production-quality B2B compliance SaaS for qualified Tier I and Tier II facilities. ContainPoint models the SPCC Plan as a structured, versioned compliance artifact connected to live facility data—not as a static PDF.

---

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Dashboard Guide](#dashboard-guide)
- [Feature Reference](#feature-reference)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)

---

## Overview

ContainPoint is designed for facilities subject to the EPA's Spill Prevention, Control, and Countermeasure (SPCC) rule. It provides:

- **Structured plan management** — Versioned SPCC plans with 13 required sections, certification tracking, and approval workflows
- **Asset & containment registries** — Oil storage inventory, secondary containment structures, and asset–containment linking
- **Inspection engine** — Asset-class-aware templates, scheduled inspections, execution with evidence-grade records and signatures
- **Corrective action tracking** — From inspection failures through closure
- **Training & annual briefings** — Personnel records and sign-off tracking
- **Incident / discharge log** — Spill history with severity, root cause, and response actions
- **5-year review & amendments** — Formal review workflow with amendment tracking
- **Export center** — Generate Plan summaries, inspection reports, corrective action registers, training logs, incident logs, and full audit packs
- **Consultant portfolio** — Multi-facility oversight for consultants and org admins

---

## Getting Started

### Prerequisites

- **Node.js 18+**
- **PostgreSQL** (or [Prisma Postgres](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases) for local dev)

### Quick Start

```bash
# Clone and install
git clone <repo-url>
cd dashboard
npm install

# Database
npx prisma migrate dev
npm run db:seed

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

Copy `.env.example` to `.env` and set:

| Variable     | Description                          |
|-------------|--------------------------------------|
| `DATABASE_URL` | PostgreSQL connection string       |
| `AUTH_SECRET`  | `openssl rand -base64 32`          |
| `AUTH_URL`     | e.g. `http://localhost:3000`       |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (for file storage) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for file storage) |

**Supabase Storage (for Vercel / production):** When both Supabase env vars are set, uploaded files and exports are stored in Supabase instead of the local filesystem. Create a bucket named `uploads` in your Supabase project (Storage → New bucket). If Supabase is not configured, files use `./uploads` locally.

### Demo Credentials

After running `npm run db:seed`:

| Field    | Value                     |
|----------|---------------------------|
| Email    | `seed@containpoint.com`   |
| Password | `Seed1234!`               |

The seeded org has three demo facilities: North Valley Fleet Depot, Central Equipment Yard, and East Manufacturing Site.

---

## Dashboard Guide

This section walks through the main screens and how they work.

### 1. Login

![Login](docs/screenshots/01-login.png)

The login page uses credentials authentication via NextAuth. Enter your email and password to access the application. Users are associated with an organization; org admins see all facilities, while facility managers see only facilities they are assigned to.

---

### 2. App Dashboard

![App Dashboard](docs/screenshots/02-app-dashboard.png)

The **org-level dashboard** is the landing page after login. It shows:

- **Facilities** — A table of all facilities you can access, with qualification tier, compliance status, asset count, and containment unit count
- **Cross-facility overdue items** — If you have multiple facilities, any overdue inspections or corrective actions are surfaced in amber-bordered cards
- **Quick actions** — "New facility" and "View" links for each facility

Use the sidebar to navigate: **Dashboard**, **Facilities**, **Portfolio**, and **Settings**. When you open a specific facility, the sidebar switches to facility-scoped navigation.

---

### 3. Facilities List

![Facilities](docs/screenshots/03-facilities.png)

The facilities list provides a summary table of all facilities in your organization. Columns include:

| Column     | Description                                |
|------------|--------------------------------------------|
| Facility   | Facility name (links to facility dashboard) |
| Status     | DRAFT, ACTIVE, INACTIVE, ARCHIVED          |
| Tier       | Qualification tier (TIER_I, TIER_II, etc.) |
| Assets     | Count of registered assets                 |
| Containment| Count of containment units                 |

Click a facility name or **View** to enter the facility dashboard.

---

### 4. Facility Dashboard

![Facility Dashboard](docs/screenshots/04-facility-dashboard.png)

The **facility dashboard** is the main compliance overview for a single facility. It displays:

- **Compliance status** — COMPLIANT, AT_RISK, or NONCOMPLIANT (from the validation engine)
- **Hard failures** — Count of blocking issues (e.g., overdue inspections, unsigned records)
- **Risk flags** — Warnings that don’t block compliance
- **Upcoming inspections** — Inspections due soon with template and asset
- **Overdue corrective actions** — Open actions past due date
- **5-year review** — Next review due date from the facility profile
- **Annual briefing** — Whether a recent annual briefing has been completed

Quick links take you to Setup, Profile, Assets, Containment, Plan, Inspections, Corrective Actions, and Training.

---

### 5. Plan Overview

![Plan Overview](docs/screenshots/05-plan-overview.png)

The **SPCC Plan** is modeled as structured data, not just an uploaded file. The plan overview shows:

- **Current version** — Version number, effective date, certification type (Owner/Operator self-certified or PE certified), and next 5-year review date
- **Version history** — All plan versions with status (DRAFT, IN_REVIEW, APPROVED, SUPERSEDED)
- **5-year reviews** — Scheduled and completed reviews with status
- **Amendments** — Amendment records linked to the plan

You can create a new draft version (when no draft exists), view the current version, or continue editing an existing draft.

---

### 6. Plan Version Detail

![Plan Version Detail](docs/screenshots/06-plan-version.png)

The **plan version detail** page provides:

- **Section sidebar** — Navigation for all 13 plan sections:
  - Applicability, Facility Information, Facility Diagram & Attachments
  - Oil Storage Inventory, Spill History, Secondary Containment
  - Inspection & Testing Procedures, Loading/Unloading Controls
  - Security Measures, Personnel & Training
  - Emergency Contacts & Response Notes
  - Amendment Log, Attachments

- **Section content** — Editable narrative text for each section (when the version is in DRAFT or IN_REVIEW)
- **System-generated sections** — Sections like Oil Storage Inventory and Spill History can be populated from live facility data
- **Certification block** — Shown for approved versions (certifier name, title, date, site visit)
- **Approve & lock** — For draft versions, opens a dialog to record certification details and lock the version

Approved versions are read-only. New drafts are created from the current approved version.

---

### 7. Incidents

![Incidents](docs/screenshots/07-incidents.png)

The **Incident / Discharge Log** records spills and discharges. For each incident you can capture:

- Title, date/time, severity (LOW, MEDIUM, HIGH, CRITICAL)
- Source asset (optional link to an asset)
- Estimated total spilled (gal), estimated amount to water (gal)
- Impacted waterbody, cause, immediate actions, notes

High-severity incidents are highlighted with a warning banner. Incident history feeds into the plan’s Spill History section and can affect qualification.

---

### 8. Export Center

![Export Center](docs/screenshots/08-export-center.png)

The **Export Center** generates compliance documents from live data. Available export types:

| Export Type            | Description                               |
|------------------------|-------------------------------------------|
| Plan (PDF)             | SPCC Plan summary                         |
| Inspection report      | Inspection history and schedules          |
| Corrective action register | Open and closed corrective actions   |
| Training log           | Training events and attendance            |
| Container inventory    | Asset/container list                      |
| Containment basis      | Containment units and capacity            |
| Review memo            | 5-year review records                     |
| Incident log           | Spill/discharge history                   |
| **Full audit pack**    | Bundled compliance evidence               |

Select a type, click **Generate**, and the system creates a PDF artifact. Completed exports appear in the history table with a download link.

---

### 9. Portfolio

![Portfolio](docs/screenshots/09-portfolio.png)

The **Portfolio** page is a consultant/multi-facility view. It shows:

- **Cross-facility overdue items** — Inspections and corrective actions overdue across all facilities
- **Facilities table** — Facility name, qualification tier, plan status, 5-year review date, annual briefing status, asset count, and open corrective actions

Use it to see compliance status at a glance and quickly jump to specific facilities or overdue items.

---

### 10. Assets

![Assets](docs/screenshots/10-assets.png)

The **Asset Registry** lists all oil storage containers and related equipment. Columns include:

- Code, name, type (bulk storage, drum, transformer, mobile container, etc.)
- Oil type, capacity (gal), status
- Linked containment, last inspection date

Assets can be linked to containment units and inspection templates. They feed into the plan’s Oil Storage Inventory section.

---

### 11. Inspections

![Inspections](docs/screenshots/11-inspections.png)

The **Inspections** area covers:

- **Templates** — Asset-class-aware inspection templates with configurable items
- **Schedule** — Scheduled inspections with due dates, templates, and assigned assets
- **Execution** — Run inspections, record results, capture evidence, and sign to lock records

Completed inspections can trigger corrective actions. Inspection history supports the plan’s Inspection & Testing Procedures section.

---

## Feature Reference

### Navigation

| Context    | Sidebar items                                                                 |
|------------|-------------------------------------------------------------------------------|
| Global     | Dashboard, Facilities, Portfolio, Settings                                    |
| Facility   | Dashboard, Setup, Profile, Applicability, Assets, Containment, Plan, Inspections, Corrective Actions, Training, Incidents, Exports, Obligations |

### Key Workflows

1. **Setup wizard** — Guided flow for applicability, qualification, profile, accountable person, and initial assets/containment
2. **Plan approval** — Create draft → edit sections → approve with certification → version locked
3. **5-year review** — Schedule review → complete with checklist → optionally create amendment
4. **Inspection** — Create template → schedule → run inspection → sign & lock → create corrective actions if needed
5. **Export** — Request export type → system generates document → download artifact

### Validation Engine

The validation engine evaluates:

- Hard failures: overdue inspections, unsigned records, missing containment, etc.
- Risk flags: incomplete templates, narrative gaps, etc.

Status is shown on the facility dashboard and in the portfolio.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Framework  | Next.js 16 (App Router)           |
| Language   | TypeScript                        |
| Styling    | Tailwind CSS                      |
| Database   | PostgreSQL + Prisma 7             |
| Auth       | NextAuth v5 (credentials)         |
| Validation | Zod                               |
| Forms      | React Hook Form                   |
| UI         | Radix UI, Lucide icons            |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── app/               # Main app (authenticated)
│   │   ├── facilities/    # Facility-scoped pages
│   │   │   └── [facilityId]/
│   │   │       ├── plan/          # Plan overview & version detail
│   │   │       ├── incidents/     # Incident log
│   │   │       ├── exports/       # Export center
│   │   │       ├── assets/        # Asset registry
│   │   │       ├── containment/   # Containment registry
│   │   │       ├── inspections/   # Templates, schedule, run
│   │   │       └── ...
│   │   └── portfolio/     # Multi-facility view
│   ├── api/               # API routes
│   └── login/             # Auth pages
├── components/            # Shared UI components
├── lib/                   # Services and utilities
│   ├── plan-service.ts    # Plan CRUD, versioning, approval
│   ├── export-service.ts  # Document generation
│   ├── validation.ts      # Compliance validation engine
│   └── audit.ts           # Audit logging
└── generated/prisma/      # Prisma client
```

---

## Capturing Screenshots

To regenerate the documentation screenshots:

1. **Start the app** — `npm run dev`
2. **Ensure DB is seeded** — `npm run db:seed`
3. **Run the capture script** — `npm run screenshots`

Screenshots are saved to `docs/screenshots/`. The script uses Playwright to log in and capture each main screen.

---

## License & Support

Proprietary. Contact your organization administrator for access and support.
