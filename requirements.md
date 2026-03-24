Yes. For **V1**, you should build a **narrow, regulation-mapped operational system** for **qualified facilities** first, especially **Tier I** and **Tier II** facilities that can self-certify their SPCC Plans. EPA’s current guidance says qualified facilities can self-certify instead of using a PE, and Tier I facilities can use the streamlined Appendix G template; qualified-facility status depends on having **10,000 gallons or less** of aggregate aboveground storage and a clean enough discharge history, and Tier I adds the requirement that no individual aboveground container exceed **5,000 gallons**. ([US EPA][1])

That means V1 should **not** try to solve every SPCC scenario. It should solve this one extremely well:

> “A small or mid-sized regulated facility, or the consultant managing several such facilities, needs to determine applicability, keep a live SPCC system of record, run and sign inspections, track corrective actions, manage annual briefings/training, document 5-year reviews and amendments, and generate regulator-ready evidence instantly.”

That scope is justified by the rule itself: SPCC requires facilities to develop, maintain, and implement a Plan; conduct inspections/tests under written procedures; keep signed records with the Plan for **3 years**; train oil-handling personnel; designate an accountable person; conduct discharge-prevention briefings **at least annually**; and review the Plan at least every **5 years**, amending within **6 months** when needed and implementing amendments within the next **6 months**. ([US EPA][2])

## 1. The exact V1 product boundary

### What V1 must do

V1 must cover seven jobs end to end:

1. **Applicability and tiering**
2. **Facility and oil-asset registry**
3. **Plan-as-data plus versioned plan exports**
4. **Inspections/tests with signed records**
5. **Corrective action tracking**
6. **Training and annual briefing records**
7. **Review/amendment and audit-pack generation**

This is the minimum surface area that maps directly onto core SPCC obligations. EPA’s own materials also make clear that secondary containment details, inspection/testing procedures, training, and plan review are recurring obligations, not one-time paperwork. ([US EPA][3])

### What V1 should explicitly not do

Do **not** build these in V1:

* PE-certified advanced authoring for complex non-qualified sites
* broad EHS modules like air, stormwater, waste
* IoT telemetry
* native iOS/Android apps
* complicated geospatial site mapping
* automated regulator filing
* benchmarking or predictive analytics

Those are later. The current market already has broader environmental platforms offering mobile inspections, compliance calendars, analytics, and other modules; your V1 should win by being **SPCC-specific, faster to deploy, and more structured around evidence**. ([Ecesis EHS Software][4])

## 2. Product philosophy for V1

V1 is **not** “SPCC software” in the abstract. It is:

> **A versioned compliance system of record for self-certifiable SPCC programs.**

Everything in the backend should be built around four principles:

1. **Every requirement becomes a trackable object**
2. **Every inspection/test becomes evidence**
3. **Every failure becomes a corrective-action workflow**
4. **Every plan change becomes a versioned event**

That model fits the rule better than “documents + reminders,” because SPCC is performance-based for inspections/testing, relies on written procedures, and depends heavily on defensible records. EPA explicitly says the rule does **not** prescribe a single inspection frequency or method for aboveground containers; facilities must use written procedures based on good engineering practice and relevant standards. ([US EPA][5])

## 3. The exact user types in V1

You need four real roles:

### 1. Org Admin

Usually owner, EHS lead, or consultant principal.
Can configure facilities, users, templates, exports, billing.

### 2. Facility Manager

Owns one or more sites.
Can manage assets, approve inspections, review corrective actions, run exports.

### 3. Inspector / Operator

Completes inspections and uploads evidence.
Can create issues but not approve plan changes.

### 4. Reviewer / Consultant

Can review inspection completeness, approve or reject records, and generate deliverables.

You also need one required **facility accountability role**, because the rule requires designation of a person at each applicable facility who is accountable for discharge prevention and reports to management. ([ECFR][6])

## 4. The exact modules in V1

## Module A — Applicability and qualification wizard

This is the entry point.

### Purpose

Determine:

* whether SPCC applies
* whether the facility is a qualified facility
* whether it is Tier I or Tier II
* whether V1 is an acceptable fit

### Inputs

* facility type
* non-transportation-related? yes/no
* aggregate aboveground oil storage capacity
* buried storage capacity
* reasonable expectation of discharge to navigable waters/adjoining shorelines
* excluded containers flags:

  * <55 gal
  * permanently closed
  * motive power
  * wastewater treatment
* spill history in prior 3 years:

  * any single discharge >1,000 gal to navigable waters/adjoining shorelines
  * any two discharges >42 gal each within 12 months

Those are all rule-critical. EPA’s current applicability and qualified-facility guidance is explicit on thresholds, exclusions, and spill-history conditions. ([US EPA][7])

### Outputs

* `spcc_applicable: true/false`
* `qualification_status: not_applicable | pe_certified_only | tier_ii | tier_i`
* `reason_codes: []`
* `v1_fit: ideal | acceptable | out_of_scope`

### V1 rule

If `qualification_status = pe_certified_only`, allow the account but show:

* “Out of V1 primary scope”
* no plan-template auto-generation
* limited manual records mode only

## Module B — Facility master record

This is the legal/operational nucleus.

### Core fields

* facility legal name
* DBA name
* org owner
* physical address
* latitude / longitude
* EPA region
* NAICS / industry
* site status: active/inactive/archived
* non-transportation-related basis
* discharge expectation narrative
* nearest waterbody / drainage notes
* normal hours / unattended periods
* accountable person
* emergency contacts
* consultant of record
* plan certification basis: owner/self-certified/PE
* current qualification tier
* current plan effective date
* next 5-year review due date

### Why this matters

This record is needed because the facility—not just the org—is the compliance unit, and SPCC duties attach to the facility’s applicability, spill history, accountable person, plan version, and operational characteristics. ([US EPA][7])

## Module C — Oil asset and containment registry

This is the most important data model in V1.

### Main entity types

* bulk storage container
* drum/tote
* transformer or oil-filled operational equipment
* mobile container parked/stored on site
* loading/unloading area
* transfer area
* containment structure
* drain / valve / outfall
* piping segment (lightweight in V1)

### Container fields

* internal asset ID
* user-facing asset code
* asset name
* asset type
* oil type
* storage capacity (gal)
* current typical fill %
* threshold_counted boolean
* exclusion_reason enum
* aboveground/buried
* indoor/outdoor
* active/permanently_closed
* associated containment ID
* associated transfer area ID
* install date
* retirement date
* manufacturer
* material
* dimensions
* overfill protection notes
* integrity testing basis
* inspection procedure template ID
* inspection frequency
* last inspection date
* next inspection date
* last integrity test date
* next integrity test due
* attachments
* comments

### Containment fields

* containment ID
* type (dike/berm/pallet/building floor/sump/etc.)
* linked assets
* largest single tank capacity
* freeboard basis
* capacity calculation method
* calculated capacity value
* calc attachment
* drainage control notes
* condition status
* last inspection date

EPA recommends that the facility keep calculations serving as the basis for secondary-containment capacity readily available, even if the calculations are not literally required to sit inside the Plan; that makes a containment-basis field plus attachment storage a very good V1 decision. ([US EPA][8])

### Why this module must be structured, not document-only

Competitors already offer “container management,” “containment calculations,” and inspection modules. If your asset registry is weak, your entire system collapses into file storage. ([Ecesis EHS Software][4])

## Module D — Plan-as-data and versioning

Do **not** store the SPCC Plan as a single dumb PDF.

Store it as:

1. structured sections
2. attachments
3. generated exports

### Plan record fields

* plan ID
* facility ID
* version number
* status: draft / in_review / approved / superseded
* qualification basis
* certification type
* certified by
* certification date
* site visit/examination date
* effective date
* superseded date
* review due date
* generated PDF path
* generation hash
* locked snapshot jsonb

EPA states that a self-certifying owner/operator must visit and examine the facility as part of self-certification, so your plan certification workflow should include that attestation explicitly. ([US EPA][9])

### Plan sections in V1

Model these as first-class sections:

* applicability determination
* facility diagram/files
* oil storage inventory
* spill history
* containment measures
* inspection/testing procedures
* loading/unloading controls
* security measures
* personnel/training
* emergency contacts/procedures
* brittle points / known issues
* amendment log
* attachments

This aligns with the functional structure expected in the rule and Tier I template materials. ([US EPA][10])

### V1 plan-generation rule

Generate:

* a polished internal “ContainIQ Plan”
* a regulator-oriented PDF export
* a compact audit pack
* a review/amendment memorandum

Do not promise that your generated plan is automatically legally sufficient in every state/facility configuration. The product should present it as a structured draft/system of record unless customer scope is explicitly Tier I/Tier II self-certified.

## Module E — Inspection and test engine

This is the core operational module.

### Regulatory baseline

The rule requires inspections/tests under written procedures developed by the facility or certifying engineer, with signed records kept with the Plan for 3 years. EPA also says the rule is performance-based and relies on good engineering practice and industry standards rather than one universal frequency. ([ECFR][11])

### What the engine must support

* recurring schedule creation
* custom procedure templates
* checklist items
* field completion on phone/tablet
* offline mode
* photo evidence
* supervisor/inspector signature
* pass/fail/NA scoring
* issue creation from failed checks
* exportable inspection report
* immutable completed record

### Entities

* inspection template
* template version
* scheduled inspection
* inspection execution
* inspection item result
* evidence file
* signoff record

### Inspection template fields

* template name
* facility-specific or org-wide
* applies to asset types
* regulatory basis note
* procedure text
* expected frequency
* checklist item list
* required evidence count
* required signature roles

### Scheduled inspection fields

* due date
* recurrence rule
* linked asset(s)
* assigned user
* priority
* status: scheduled / in_progress / completed / missed / canceled

### Executed inspection fields

* start timestamp
* completion timestamp
* geo capture optional
* performer
* reviewer
* signature data
* item results
* linked corrective actions
* generated PDF

### V1 checklist item schema

* item ID
* prompt text
* response type: boolean / number / text / single_select / multi_select / photo_required / signature_required
* acceptable range
* fail severity
* auto-create action? yes/no
* reference note

### V1 non-negotiable completion rules

A completed inspection cannot be editable in place.
If edited after signoff, create a **superseding revision**, preserving the original signed record.

That is the right design because SPCC records are evidence, not mutable notes.

## Module F — Corrective action engine

Every failed item must become a workflow object.

### Action fields

* action ID
* source inspection item
* facility
* asset
* title
* severity: low/medium/high/critical
* regulatory relevance note
* owner
* due date
* status: open / in_progress / pending_verification / closed / accepted_risk
* root cause
* corrective action description
* closure note
* closure evidence files
* verified by
* verified at

### Why this is essential

Competitors already understand this. Mapistry explicitly emphasizes assigning and tracking corrective actions from inspections; Ecesis also markets action-item tracking to completion. You need this in V1 or your “inspection product” will not be competitive. ([Mapistry][12])

### V1 state machine

`open -> in_progress -> pending_verification -> closed`

Optional:
`open -> accepted_risk` only for admin/reviewer with required justification.

## Module G — Training and annual briefing records

This module is required earlier than most founders realize.

### Regulatory baseline

SPCC requires training of oil-handling personnel, designation of an accountable person, and discharge-prevention briefings at least once a year, including discussion of known discharges, failures/malfunctions, and precautionary measures. EPA also clarifies who counts as oil-handling personnel. ([US EPA][13])

### Entities

* personnel record
* role classification
* oil-handling qualification flag
* training event
* annual briefing event
* attendance record
* acknowledgement/signature

### Personnel fields

* full name
* employer
* contractor yes/no
* facility
* role title
* oil_handling_personnel boolean
* active/inactive
* hire date
* supervisor
* email / phone

### Training event fields

* facility
* type: onboarding / annual_briefing / remedial / contractor_orientation
* date
* instructor
* agenda/topics
* linked known spills/failures discussed
* attached materials
* attendees
* signatures

### V1 rule

Generate a facility-level “annual briefing due” task if 365 days pass without a qualifying briefing record.

## Module H — 5-year review and amendment workflow

### Regulatory baseline

The Plan must be reviewed at least every 5 years. If more effective, field-proven technology would materially reduce discharge likelihood, the Plan must be amended within 6 months of review and implemented within 6 months after amendment. EPA also distinguishes technical versus non-technical changes, and non-technical changes do not necessarily need PE certification. ([ECFR][14])

### Entities

* review cycle
* review checklist
* amendment record
* amendment classification
* certification requirement

### Amendment fields

* amendment ID
* trigger source
* trigger type: 5_year_review / ownership_change / asset_change / spill_event / procedural_change / consultant_recommendation
* technical vs non_technical
* PE_required boolean
* created_at
* due_by
* implemented_by
* status
* description
* affected sections
* before/after diffs
* files

### V1 workflow

1. Review created automatically from effective date
2. Reviewer completes checklist
3. System determines if amendment required
4. If yes, create amendment task with deadlines
5. Generate amendment memorandum and new plan draft
6. Lock prior plan version

## Module I — Incident and discharge log

Even if you do not automate all reporting, you need incident capture in V1.

### Why

A discharge can change reporting obligations and can knock a facility out of qualified status. EPA’s current guidance says qualifying thresholds for EPA reporting include more than 1,000 gallons in a single discharge to navigable waters/adjoining shorelines, or more than 42 gallons in each of two discharges within 12 months; similar discharge history is also central to qualified-facility status. ([US EPA][1])

### Incident fields

* date/time
* facility
* source asset
* estimated total spilled
* estimated amount reaching water/shoreline
* impacted waterbody
* cause
* discovered by
* immediate actions
* reported_to_nrc boolean
* reported_to_epa_ra boolean
* attachments
* follow-up action items

### V1 automation

If `amount_to_water > 1000` in one event, flag:

* “EPA RA reporting review required”
* “Qualified facility status likely impacted”

If two events in 12 months have `amount_to_water > 42`, same.

Do **not** auto-submit reports in V1.

## Module J — Audit pack and export center

This is the commercial wedge.

### Required export types

1. Current SPCC Plan PDF
2. Inspection history report
3. Corrective action aging report
4. Training and annual briefing log
5. Container inventory report
6. Containment-basis packet
7. Review/amendment log
8. Incident log
9. Full audit pack ZIP/PDF bundle

### Export characteristics

* point-in-time snapshot
* plan version reference
* generated timestamp
* generated by
* immutable export manifest
* pagination and facility branding
* optional consultant branding

### Why this matters

The whole value proposition is instant proof. Competitors already market regulator-ready exports, cloud-stored inspection records, and centralized data. V1 needs to match that baseline. ([Ecesis EHS Software][4])

## 5. The exact backend architecture I would choose

I would build V1 as:

### Frontend

* **Next.js**
* TypeScript
* Tailwind
* React Hook Form
* TanStack Query
* PWA support for offline inspections

### Backend

* **NestJS** with TypeScript
* REST API first
* background job queue
* separate document-generation worker

### Database

* **PostgreSQL**
* JSONB where flexibility is necessary
* strict relational core for compliance objects

### File storage

* **S3-compatible object storage**
* versioned buckets
* signed URLs

### Queue / async

* **Redis + BullMQ**
  for:
* reminders
* export generation
* nightly due-date recompute
* scheduled escalation
* PDF generation

### Search

* PostgreSQL full-text for V1
* no Elasticsearch yet

### Hosting

* Vercel or CloudFront for frontend
* ECS/Fargate or Railway/Fly for backend early
* managed Postgres
* S3 / R2 object storage

### Why this stack

You need:

* strong typing
* multi-tenant permission safety
* auditability
* background jobs
* fast PDF/document export
* a clean path to consultant/portfolio mode

## 6. The exact database schema to start with

Below is the relational core. Do **not** try to keep this in a spreadsheet-like document database.

### Tenancy and auth

* `organizations`
* `users`
* `organization_memberships`
* `facilities`
* `facility_memberships`
* `facility_contacts`

### Compliance core

* `facility_profiles`
* `facility_applicability_assessments`
* `facility_qualification_records`
* `facility_accountable_persons`

### Assets

* `oil_types`
* `assets`
* `asset_containers`
* `containment_units`
* `asset_containment_links`
* `transfer_areas`
* `loading_unloading_points`
* `asset_status_history`

### Plan system

* `plans`
* `plan_versions`
* `plan_sections`
* `plan_section_revisions`
* `plan_attachments`
* `plan_certifications`
* `plan_reviews`
* `plan_amendments`

### Inspections

* `inspection_templates`
* `inspection_template_versions`
* `inspection_template_items`
* `scheduled_inspections`
* `inspection_runs`
* `inspection_item_results`
* `inspection_signatures`

### Actions

* `corrective_actions`
* `corrective_action_comments`
* `corrective_action_evidence`
* `corrective_action_status_history`

### Training

* `personnel`
* `training_events`
* `training_attendance`
* `briefing_topics`
* `training_signatures`

### Incidents

* `incidents`
* `incident_reports`
* `incident_files`

### Exports and evidence

* `files`
* `file_versions`
* `exports`
* `export_manifests`

### Auditability

* `audit_events`
* `domain_events`
* `notification_jobs`
* `webhook_deliveries`

## 7. Exact data shape for key entities

A good V1 rule is:

* relational for identity and linkage
* JSONB for versioned snapshots

Example `assets` core:

```json
{
  "id": "ast_123",
  "facility_id": "fac_123",
  "asset_type": "bulk_storage_container",
  "name": "Diesel AST #1",
  "oil_type_id": "oil_diesel",
  "capacity_gallons": 2000,
  "counted_toward_threshold": true,
  "storage_location": "North yard",
  "containment_unit_id": "cnt_45",
  "status": "active"
}
```

Example `facility_qualification_records`:

```json
{
  "facility_id": "fac_123",
  "spcc_applicable": true,
  "qualified_facility": true,
  "tier": "tier_i",
  "aggregate_aboveground_capacity_gallons": 8600,
  "max_individual_container_gallons": 2000,
  "single_discharge_gt_1000_last_3y": false,
  "two_discharges_gt_42_within_12m_last_3y": false,
  "assessment_date": "2026-03-23"
}
```

Example `inspection_runs`:

```json
{
  "id": "insrun_123",
  "scheduled_inspection_id": "sched_88",
  "facility_id": "fac_123",
  "performed_by_user_id": "usr_9",
  "started_at": "2026-04-05T15:00:00Z",
  "completed_at": "2026-04-05T15:18:00Z",
  "status": "completed",
  "signature_required": true,
  "locked": true
}
```

## 8. Exact workflow logic

## Workflow 1 — Facility onboarding

1. Create org
2. Create facility
3. Run applicability wizard
4. Enter spill history
5. Classify Tier I / Tier II / out of scope
6. Add accountable person
7. Add assets and containment
8. Upload current plan or start generated plan
9. Select inspection templates
10. Generate first obligations calendar

## Workflow 2 — Monthly/periodic inspection

1. Scheduled inspection appears
2. Inspector opens PWA on phone
3. Selects asset
4. Completes checklist
5. Uploads photos
6. Signs
7. Failed items auto-create corrective actions
8. Reviewer optionally approves
9. Record locks
10. Inspection PDF available

## Workflow 3 — Annual training/briefing

1. Reminder triggers 30 days before due
2. Manager creates event
3. Selects oil-handling personnel
4. Adds topics discussed
5. Collects signoffs
6. Event stored in briefing log

## Workflow 4 — 5-year review

1. Review record auto-created
2. Reviewer completes checklist
3. System asks whether technology/procedures/assets changed
4. Amendment record created if needed
5. New plan version generated
6. Old version archived

## Workflow 5 — Audit pack generation

1. User selects facility and date range
2. System compiles current plan version + records
3. Worker generates PDF/ZIP
4. Manifest stored
5. Download link issued

## 9. Exact notification engine

V1 reminders should be simple and email-first.

### Trigger types

* inspection due in 30/14/7/1 days
* inspection overdue
* corrective action overdue
* annual briefing due
* review due in 90/30/7 days
* amendment deadline due
* missing accountable person
* unsigned completed inspection
* facility classification stale after asset change

### Delivery

* email only in V1
* in-app notifications
* no SMS yet

### Job cadence

* nightly obligations recompute
* hourly due/overdue notifier
* immediate event-driven notifications for failures and signoff requests

## 10. Exact permission model

### Org Admin

everything

### Facility Manager

everything within facility except billing and org settings

### Inspector

read facility, execute assigned inspections, upload evidence, create issues

### Reviewer / Consultant

review inspections, generate exports, manage templates, not billing unless org admin

### Read-only auditor

can view locked records and exports, cannot edit anything

V1 should also support **external consultant access** without giving them cross-client leakage. So every facility membership must be explicit.

## 11. Exact evidence/file model

Every file should have:

* object key
* mime type
* sha256 checksum
* uploader
* upload timestamp
* linked object type
* linked object id
* optional caption
* version number
* deletion status

### File classes

* plan attachment
* inspection photo
* signature image
* containment calculation
* training material
* incident evidence
* export artifact

### Hard rule

Never hard-delete files in V1.
Archive or supersede only.

## 12. Exact audit log model

You need an append-only `audit_events` table.

Fields:

* event_id
* timestamp
* actor_user_id
* org_id
* facility_id
* object_type
* object_id
* action
* before_json
* after_json
* ip
* user_agent
* correlation_id

This is not optional. In compliance software, auditability is core infrastructure.

## 13. Exact API surface

Do REST first.

### Main route groups

* `/auth`
* `/organizations`
* `/facilities`
* `/facilities/:id/applicability`
* `/facilities/:id/qualification`
* `/facilities/:id/assets`
* `/facilities/:id/containment`
* `/facilities/:id/plans`
* `/facilities/:id/inspections`
* `/facilities/:id/actions`
* `/facilities/:id/training`
* `/facilities/:id/incidents`
* `/facilities/:id/exports`
* `/templates`
* `/notifications`

### Required endpoint behaviors

* idempotent POSTs for exports and scheduled jobs where possible
* optimistic locking on mutable structured records
* locked completed records
* pagination everywhere
* filter by facility, date range, status, asset

## 14. Exact dashboard for V1

V1 dashboard should be brutally practical, not pretty-for-the-sake-of-pretty.

### Top row

* compliance status badge
* inspections due
* overdue actions
* annual briefing due status
* next 5-year review date

### Main panels

1. upcoming inspections
2. overdue corrective actions
3. recently completed inspections
4. facility asset summary
5. current plan version status
6. quick actions:

   * run inspection
   * generate audit pack
   * add incident
   * add training event

### Secondary panels

* qualification tier and applicability summary
* accountable person card
* recent amendment/activity log

## 15. Exact consultant workspace in V1

Even in facility-first V1, you should include lightweight consultant capability.

### Required consultant features

* switch between facilities
* org-wide template library
* portfolio list view
* overdue items across facilities
* bulk export generation
* per-facility branding note
* review queue

Do not build deep portfolio analytics yet. Just control + standardization.

## 16. Exact document outputs you need in V1

At minimum:

* `SPCC Plan.pdf`
* `Inspection Report.pdf`
* `Corrective Action Register.pdf`
* `Training & Briefing Log.pdf`
* `Container Inventory.pdf`
* `Containment Basis.pdf`
* `5-Year Review Memo.pdf`
* `Audit Pack.zip`

### PDF generator

Use HTML templates + headless Chromium.
Do not assemble PDFs manually.

## 17. Exact non-functional requirements

### Security

* SSO later, password + magic link first
* MFA for admins
* signed URLs for files
* tenant isolation
* row-level auth checks
* immutable audit events
* backups daily
* encrypted at rest

### Reliability

* autosave drafts
* offline inspection caching
* retries for uploads
* queue-based export generation
* health checks and job monitoring

### Performance

* dashboard <2 sec warm load
* inspection start <1 sec
* export under 60 sec for normal facility
* no blocking sync PDF generation

## 18. Exact PWA/offline scope

Do not build native mobile first.
Build a **PWA** that supports:

* login
* assigned inspections
* checklist completion
* photo capture
* sync when online returns

Offline local store:

* IndexedDB
* pending upload queue
* conflict resolution: server wins for locked records, client merge for drafts

## 19. Exact V1 implementation order

### Sprint 1

* auth
* org/facility model
* applicability wizard
* qualification engine

### Sprint 2

* asset registry
* containment registry
* file upload

### Sprint 3

* inspection templates
* scheduled inspections
* inspection execution

### Sprint 4

* corrective actions
* signatures
* locked records

### Sprint 5

* training/briefing module
* accountable person
* reminders

### Sprint 6

* plan versioning
* review/amendment flow
* PDF exports

### Sprint 7

* audit pack
* consultant switching
* polish / QA

## 20. The single most important V1 product decision

Do **not** model the product as:

> “documents with some tasks.”

Model it as:

> **a structured compliance graph that can generate documents.**

That one choice affects the whole backend:

* easier obligations engine
* cleaner exports
* better auditability
* easier consultant multi-site mode
* better future enterprise expansion

## 21. Hard recommendation on scope

If you want the cleanest V1:

### Target customer

* self-certifiable Tier I and Tier II facilities
* 1–20 sites
* consultant-managed or light internal EHS
* diesel, lube oil, hydraulic oil, generator fuel, totes, drums, ASTs

### V1 promise

* determine applicability and tier
* keep a live SPCC system of record
* run inspections and keep signed records
* track actions
* manage training/briefings
* support review/amendment deadlines
* generate audit-ready exports

That is enough to sell.

Anything more on day 1 is feature sprawl.
