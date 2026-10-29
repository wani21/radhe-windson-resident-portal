# Radhe Windson Residential Society ERP
## New IDE Handoff Context + Phase 3 Implementation Prompt

You are taking over an existing codebase. This document is the authoritative project handoff and the immediate implementation task. Read it fully before changing code.

---

# PART A — PROJECT CONTEXT

## 1. Product Goal

Project/repository: `radhe-windson-erp`

Build a production-focused, full-stack ERP for **Radhe Windson Residential Society**. It is intended for real daily users—not a demo—including society administrators and, in later phases, committee members, security staff, and residents.

The goal is to deliver reliable, secure, maintainable society operations. Every implemented feature must use real backend logic and persistent database storage. Never fake functionality to make the interface look complete.

### Core product principles

- Real users and real workflows from day one.
- Persistent MongoDB data; no in-memory arrays as a substitute for permanent storage.
- No mock authentication, fake tokens, hardcoded dashboard statistics, fabricated records, or fake success responses.
- No public administrator registration.
- Server-side authentication, authorization, validation, and ownership checks.
- Protect resident, visitor, contact, authentication, and financial information.
- Preserve historical and audit-relevant records.
- Be honest about incomplete work and test results.
- Do not import actual residents' personal data or deploy to production without appropriate approval.
- Do not claim legal or regulatory compliance without verification.

## 2. Existing Stack (Reported; Verify in Repository)

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS (the original project plan pins Tailwind CSS v3.4 to avoid mixing v3/v4 configuration)
- Existing UI component library, expected to include shadcn/ui
- Lucide React
- React Router
- Axios or the repository's existing HTTP client
- React Hook Form and Zod, where already configured
- Zustand and Recharts may be present for state and dashboards

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Zod validation
- JWT authentication in HttpOnly cookies
- bcryptjs password hashing
- Helmet, CORS, rate limiting, and the existing security middleware

### Project organization
Expected monorepo layout:
- `frontend/`
- `backend/`

API prefix: `/api/v1`

**Important:** These details are from the previous implementation report and project plan. Inspect the actual repository, package manifests, configuration, and existing code before assuming every item exists or is configured exactly as described. Preserve established conventions. Do not recreate the application or replace the existing foundation.

## 3. Previously Reported Delivery Status

### Phase 1 — Foundation
Reported as implemented:
- Frontend and backend foundation.
- API metadata and health endpoints.
- Structured 404/error response.
- Helmet security headers.
- MongoDB connection and health status.

### Phase 2 — Authentication
Reported as implemented:
- Login with valid credentials.
- Incorrect password rejection.
- Inactive user rejection.
- Authenticated profile endpoint.
- Logout clearing the session cookie.
- `tokenVersion`-based session invalidation.
- Password hash excluded from normal Mongoose query results using `select: false`.
- Password hash and sensitive fields removed from API serialization.
- CLI administrator seeder: `npm run seed:admin`.
- No public administrator registration.

Reported automated tests: **11 tests passing** across `src/app.test.ts` (4 tests) and `src/modules/auth/auth.test.ts` (7 tests).

Reported frontend build: `tsc && vite build` succeeded with zero errors, approximately 5.10 seconds.
Reported backend build: TypeScript compilation succeeded.
Reported browser smoke test: login page loaded, provisioned administrator could log in, and dashboard shell showed:
- “Welcome back, Radhe Windson Administrator”
- “Society Admin” role badge
- “Live Database Connected” operational status.

Reported live health response:
- `success: true`
- `data.status: "UP"`
- `data.database.status: "CONNECTED"`
- `data.database.readyState: 1`

These are **reported prior results, not independently verified in this handoff**. Re-run relevant tests/builds if possible. Do not claim they pass unless you execute them and observe the result.

## 4. Authentication and Security Design (Reported; Audit Actual Code)

The previous report described:
- Session cookie named `rw_token`.
- HttpOnly cookie.
- SameSite=Lax.
- Secure in production.
- No JWT, password, or session token in localStorage or sessionStorage.
- Backend origin whitelist checks.
- Client requests include `X-Requested-With`.
- `tokenVersion` on the User model; incrementing it invalidates existing sessions.
- Administrative deactivation blocks login/session use.
- JWT-based sessions with an approximately two-hour lifetime in the earlier plan.
- bcryptjs with 12 salt rounds in the administrator seeder.
- Administrator seeder reads:
  - `INITIAL_ADMIN_NAME`
  - `INITIAL_ADMIN_EMAIL`
  - `INITIAL_ADMIN_PASSWORD`
- Seeder checks minimum password complexity (at least 10 characters including uppercase, lowercase, number, and symbol), refuses accidental overwrite if an administrator already exists, and does not log the password.

Security review reminders:
- Do not assume the JWT itself is encrypted merely because it is stored in an HttpOnly cookie. Confirm the actual JWT signing/verification algorithm and secret handling.
- HttpOnly mitigates JavaScript access to a cookie; it does not by itself prevent CSRF. Verify the full CSRF strategy, SameSite behavior, Origin/Referer validation, CORS configuration, and custom request header usage.
- Confirm the `Secure` cookie flag is set in production and local development behavior is appropriate.
- Never print credentials, tokens, or secrets in logs.
- Never expose `passwordHash`, JWTs, secrets, or unnecessary internal fields in API responses.
- Check session invalidation, inactive users, role changes, and unauthorized access on the server.
- Do not weaken security controls just to make local development or browser testing work.

## 5. Roles and Authorization

Current role reported: `SOCIETY_ADMIN`.

Planned roles for the broader product:
- `SOCIETY_ADMIN`
- `COMMITTEE_MEMBER`
- `SECURITY`
- `RESIDENT`

A `SUPER_ADMIN` role should only be introduced if the actual product requirements need it.

For the current Phase 3, only `SOCIETY_ADMIN` should create/update society infrastructure, buildings, and flats. Define read permissions explicitly. Do not assume any authenticated user can read or change every resource.

Enforce authorization in backend middleware/service logic—not only by hiding frontend controls. Prevent insecure direct object reference (IDOR) issues and verify society/building ownership on every relevant operation.

## 6. Existing Product Plan

Planned modules, in a practical order:
1. Foundation and authentication — Phase 1 and Phase 2, reported complete.
2. Society, buildings/wings, and flat infrastructure — **current Phase 3 task**.
3. Resident and household management.
4. Visitor management.
5. Complaint management.
6. Maintenance records/billing and notices.
7. Dashboard and operational reporting.
8. Hardening, end-to-end tests, deployment readiness, backup/restore and operational documentation.

The precise sequence can be adjusted only if the repository's current state or a genuine dependency requires it. Explain any proposed change before broad refactoring.

## 7. Five-Day MVP Direction

The initial planning target was a five-day MVP. That is a prioritization constraint, not permission to skip security or data integrity.

Suggested prioritization:
- Foundation/authentication.
- Society/building/flat data.
- Residents and basic household management.
- Visitor and complaint workflows.
- Maintenance/notices/dashboard as time allows.
- Testing, security review, deployment readiness.

Do not integrate a real payment gateway in this phase. If manual payment recording is later implemented, it must be authorized, auditable, and never represented as a verified gateway transaction.

## 8. General Engineering Rules

1. Inspect before editing: examine directory structure, package manifests, current schemas, middleware, routes, services, tests, and UI patterns.
2. Reuse existing abstractions; avoid duplicate middleware or a parallel architecture.
3. Make small, coherent changes. Do not rewrite the foundation.
4. Follow existing naming, response envelope, error handling, linting, and test conventions.
5. Validate all request parameters, body fields, and query parameters.
6. Never pass untrusted request objects directly into MongoDB filters or update operators. Use explicit allow-listed fields.
7. Treat MongoDB database constraints/indexes as the source of truth for uniqueness under concurrency.
8. Handle MongoDB duplicate-key errors safely and return structured conflict responses.
9. Avoid destructive operations and preserve historical data. Prefer archive/soft-delete where dependent records may exist.
10. Use transactions only where supported and properly configured; do not assume MongoDB transaction support without checking deployment mode.
11. Use pagination and bounded queries for lists.
12. Do not expose stack traces or internal secrets in production responses.
13. Keep `.env` and secrets out of version control. `.env.example` may contain placeholders only.
14. Do not run destructive scripts against a production database. Use isolated test data/database.
15. Do not claim a feature, test, build, security review, or deployment is complete unless actually performed.
16. If a blocker appears, explain it and choose the safest minimal fix rather than bypassing a control.

---

# PART B — PHASE 3 IMPLEMENTATION TASK

## 9. Phase 3 Goal

Implement **Society Infrastructure & Flat Management** end to end.

Scope:
1. Society settings and profile.
2. Building/Wing management.
3. Flat directory and CRUD operations.
4. Protected REST APIs.
5. MongoDB schemas and indexes.
6. Zod validation and structured errors.
7. Frontend pages/forms connected to the real API.
8. Automated tests for business rules, authorization, persistence, and conflicts.

Do not begin Phase 4 until Phase 3 is implemented, tested, and reported.

## 10. First Action: Inspect and Report

Before making changes:
1. Inspect the repository structure and both package manifests.
2. Find the existing User model, authentication/authorization middleware, role enum, cookie setup, Zod validation pattern, error middleware, API response conventions, MongoDB connection, test setup, and dashboard layout.
3. Verify which dependencies and UI components actually exist.
4. Run baseline tests/builds if practical and safe.
5. Report a concise summary of the actual repository state, including any discrepancy with this handoff.

Then implement Phase 3 incrementally. Do not stop after only producing a plan unless there is a genuine blocker or an architectural choice that cannot safely be inferred.

## 11. Data Model Design

### 11.1 Society

Suggested fields:
- `name`: required, trimmed, length-limited.
- `registrationNumber`: optional if applicable; do not invent a real value.
- `address`: optional/required according to actual product requirements, validated.
- `contactEmail`: optional and validated.
- `contactPhone`: optional and validated.
- `settings`:
  - `maintenanceDueDay`: optional integer within a valid day range; define handling for months with fewer days.
  - `lateFee`: non-negative monetary amount, if the business has approved this field.
  - Define the meaning/unit of the late fee (for example, fixed amount versus percentage) rather than guessing.
- Timestamps.

First decide whether this application supports one society or multiple societies. The current project is for Radhe Windson Residential Society, so single-society mode may be appropriate, but inspect existing code and report the decision.

If single-society mode:
- Enforce the rule in the backend and database strategy where appropriate.
- Avoid creating multiple society documents accidentally.
- Do not silently overwrite the configured society during startup or seeding.
- Do not invent registration/contact details.
- Make initial configuration safe and repeatable.

If multi-society mode is already implemented:
- Preserve it and enforce tenant isolation consistently.

### 11.2 Building / Wing

Suggested fields:
- `name`: required, trimmed, normalized according to the agreed naming policy.
- `totalFloors`: positive integer within reasonable product limits.
- `societyId`: required valid reference to Society.
- Timestamps.

Rules:
- Validate the society exists.
- Enforce the defined duplicate-name policy; if names must be unique within a society, create an appropriate database unique index.
- Verify the building belongs to the active society for all operations.
- Floor numbers must be within the configured floor range. If the building has ground/basement floors, do not assume a simplistic numbering convention without defining it.
- Do not allow `totalFloors` to be reduced in a way that leaves existing flats with invalid floor numbers. Return a clear validation/conflict error or implement a safe migration workflow.
- Avoid hard-deleting a building that has flats or future historical/dependent records.

### 11.3 Flat

Suggested fields:
- `buildingId`: required Building reference.
- `flatNumber`: required, trimmed, normalized consistently.
- `floor`: validated integer and compatible with the building's floor policy.
- `occupancyStatus`: `VACANT`, `OCCUPIED`, or `TENANTED`.
- Timestamps.
- An archival/active field only if consistent with the existing soft-delete conventions.

Required database index:
`{ buildingId: 1, flatNumber: 1 }` as a unique compound index.

Rules:
- Flat numbers must be unique within a building.
- The same flat number may exist in different buildings if product rules allow it.
- Normalization must be consistent between create/update and the unique index strategy. Do not allow case/whitespace variants to bypass uniqueness.
- Handle concurrent duplicate requests by relying on the unique index, not only a preliminary existence query.
- Convert MongoDB duplicate-key errors to a structured `409 Conflict` response.
- Validate that the referenced building exists and belongs to the correct society.
- Do not trust `societyId`, `buildingId`, role, or ownership claims from client-supplied data without server-side validation.
- Do not create residents or assign residents during Phase 3 unless the existing architecture has an unavoidable dependency. Keep resident relationships for the later resident-management phase.
- Avoid hard deletion if future/historical records may depend on a flat.

## 12. API Requirements

Use the existing API response envelope and middleware conventions. The following endpoints are the target scope; adjust route naming only to remain consistent with the existing codebase and document any adjustment.

### Society
- `GET /api/v1/society`
- `PATCH /api/v1/society`
- `POST /api/v1/society` only if the chosen initialization/product workflow requires it.

For single-society mode, a safe idempotent setup/configuration approach is preferred over public unrestricted creation. Do not silently overwrite existing settings.

### Buildings
- `GET /api/v1/buildings`
- `GET /api/v1/buildings/:id`
- `POST /api/v1/buildings`
- `PATCH /api/v1/buildings/:id`

### Flats
- `GET /api/v1/flats`
- `GET /api/v1/flats/:id`
- `POST /api/v1/flats`
- `PATCH /api/v1/flats/:id`

### API behavior
- Use authentication middleware on every protected endpoint.
- Only `SOCIETY_ADMIN` may create/update society infrastructure in this phase.
- Explicitly define read permissions.
- Validate request body, route parameters, and query parameters with Zod or the repository's existing validation pattern.
- Allow-list accepted fields. Never mass-assign arbitrary request bodies into Mongoose updates.
- Use HTTP status codes appropriately:
  - `200` for successful reads/updates.
  - `201` for successful creation.
  - `400` for malformed request syntax if that is the current convention.
  - `401` for unauthenticated.
  - `403` for authenticated but unauthorized.
  - `404` for nonexistent resources, subject to the existing information-disclosure policy.
  - `409` for unique conflicts or state conflicts.
  - `422` for validly formed but semantically invalid input, if consistent with existing conventions.
- Use consistent structured errors without stack traces or sensitive internals.
- Implement pagination for list endpoints (for example `page` and bounded `limit`) and validated filters:
  - Buildings: optional society filter only if appropriate and safely authorized.
  - Flats: building, floor, occupancy status, and search filters where useful.
- Do not permit arbitrary MongoDB operators or raw filter objects from query parameters.
- Consider concurrency and state integrity in service logic.
- Add suitable indexes based on actual query patterns.

## 13. Frontend Requirements

Integrate with the existing authenticated dashboard and navigation. Do not recreate the dashboard shell.

### Society Settings
Create a page/form for supported society profile and settings:
- Loading state.
- Empty/unconfigured state if applicable.
- Form validation.
- Save-in-progress state.
- Success/error feedback.
- Session-expiry handling.
- No fabricated default contact or registration details.

### Building/Wing Management
Implement:
- Building list/table/cards consistent with the existing UI.
- Add-building form/dialog.
- Edit-building form/dialog.
- Floor count display.
- Loading, empty, validation, success, and failure states.
- Clear feedback when a floor-count change is rejected because of existing flats.

### Flat Directory
Implement:
- Building/wing selector.
- Flat directory grid/table.
- Search and supported filters.
- Occupancy badges for `VACANT`, `OCCUPIED`, `TENANTED`.
- Add-flat dialog/form.
- Edit-flat dialog/form.
- Duplicate flat number conflict feedback.
- Pagination if supported by the API.
- Empty/loading/error states.
- Accessible labels and keyboard-operable dialogs/forms.

Reuse existing components and dependencies, such as shadcn/ui, Lucide React, React Hook Form, and Zod, only where they actually exist. Keep frontend validation aligned with backend validation, but treat backend validation as authoritative.

All visible records and counts must come from the backend. No mock records or hardcoded statistics.

## 14. Automated Test Plan

Use the existing test runner and test conventions. The prior report mentioned Vitest, but verify the current setup before choosing tools. Use the existing integration-test approach if one exists.

### Society
- Authorized admin can read society configuration.
- Unauthenticated request is rejected.
- Unauthorized role cannot update settings.
- Invalid contact information/settings are rejected.
- Single-society creation/initialization cannot create accidental duplicates.
- Existing settings are not silently overwritten.

### Buildings
- Valid building creation succeeds.
- Invalid floor count is rejected.
- Nonexistent society reference is rejected.
- Duplicate names follow the declared policy.
- Unauthorized create/update is rejected.
- Building update cannot silently invalidate existing flat floors.
- Nonexistent building behavior is correct.

### Flats
- Valid flat creation succeeds.
- Duplicate flat in the same building returns `409`.
- Same flat number in different buildings behaves according to the policy.
- Invalid floor is rejected.
- Nonexistent building reference is rejected.
- Unauthorized create/update is rejected.
- Concurrent duplicate creation leaves only one valid record.
- Filters and pagination work.
- Updates cannot change immutable/unauthorized fields.
- Archived/removed records preserve required history.
- Records persist after reconnect/restart where practical to verify safely.

### Regression and security
- All existing Phase 1 and Phase 2 tests still pass.
- `passwordHash` and other secrets remain absent from API responses.
- Session invalidation behavior still works.
- No unauthenticated access to protected endpoints.
- IDOR and cross-society access attempts fail.
- Invalid inputs return structured errors.
- No destructive test touches production data.

Do not claim tests passed unless actually executed. Report skipped tests and why.

## 15. Commands, Builds, and Completion Report

Discover and use the actual scripts in the repository rather than assuming command names.

At completion:
1. Run the relevant backend tests.
2. Run the relevant frontend tests, if configured.
3. Run the backend TypeScript/build command.
4. Run the frontend TypeScript/production build command.
5. Inspect the final diff for accidental changes, secrets, debug code, or weakened security.
6. Confirm the required MongoDB indexes are created in the expected environments and explain any deployment/index-build requirement.
7. Summarize the implementation.

Final report must include:
- Actual files/modules added or changed.
- Models and indexes implemented.
- API endpoints and authorization rules.
- Frontend pages and workflows implemented.
- Test commands executed and actual pass/fail counts.
- Build commands executed and actual results.
- Known issues, skipped tests, and remaining security/data-integrity concerns.
- Manual setup steps or environment variables, if any.
- Confirmation that no real resident data was imported and no production deployment was performed unless explicitly authorized.

Phase 3 is complete only if the definition of done below is satisfied or all remaining gaps are clearly documented.

## 16. Phase 3 Definition of Done

- Society, Building, and Flat operations use persistent MongoDB records.
- Single-/multi-society behavior is explicitly defined and consistently enforced.
- Database indexes and schema validation are implemented.
- Protected APIs enforce authentication, authorization, and resource boundaries.
- Duplicate flat creation is prevented at the database level.
- Invalid requests fail with structured errors.
- Frontend is connected to the real backend.
- Loading, empty, validation, conflict, session-expiry, and error states work.
- Tests cover core business rules and security boundaries.
- Existing Phase 1/2 tests still pass.
- Frontend and backend production builds succeed.
- No mock records, fake success paths, or hardcoded operational statistics were introduced.
- Incomplete work is documented honestly.
- No production deployment or real resident-data import occurs without explicit approval.

---

# PART C — OPERATING INSTRUCTIONS FOR THE NEW AI/IDE

1. Start by inspecting the actual repository. Treat the status above as a handoff report, not unquestionable truth.
2. Keep all existing working functionality unless a change is required and explained.
3. Implement Phase 3 end to end, incrementally.
4. Prioritize data integrity, authorization, and tests before polishing the UI.
5. Ask a question only if a decision cannot safely be inferred from the code or stated requirements. Otherwise choose the safest minimal implementation and document the choice.
6. Do not bypass security checks to make the application appear to work.
7. Do not install unnecessary dependencies if existing ones can do the job.
8. Do not move to Phase 4 until Phase 3 verification and reporting are complete.
9. Never claim that a test, browser check, build, or security property was verified unless it was actually checked.
10. If the IDE has context/rate limits, preserve this file and leave a concise progress note describing completed tasks, remaining work, test results, and exact next steps.

## Immediate instruction

**Inspect the existing `radhe-windson-erp/` repository, establish the real baseline, then implement Phase 3 — Society Infrastructure & Flat Management — according to this document.**
