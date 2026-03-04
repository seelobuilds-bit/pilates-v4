# Reporting System Inventory

This document is the baseline map for reporting, analytics, and scorekeeping across the platform.

The intent is safety:

- Desktop reporting remains the current source of truth.
- Mobile and secondary surfaces should migrate toward shared backend logic, not invent new calculations.
- No route should be rewritten until its current behavior is mapped and parity-checked.

## Canonical Source Of Truth (Current)

Primary trusted reporting route:

- `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`

Supporting shared helpers already in use:

- `/Users/charlie/Development/pilates-v4/src/lib/reporting/metrics.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/db-query-mode.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/class-flows/analytics.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/marketing/analytics.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/vault/analytics.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/website-analytics/metrics.ts`

Current mobile reporting service:

- `/Users/charlie/Development/pilates-v4/src/lib/reporting/mobile-reports.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/reports/route.ts`

Teacher summary stats (separate from studio reports):

- `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`

Website analytics (separate engine):

- `/Users/charlie/Development/pilates-v4/src/app/api/studio/website-analytics/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/demo/website-analytics/route.ts`

Leaderboard scoring engine:

- `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/scoring.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/cycle.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/metrics.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/leaderboards/route.ts`

## Canonical Business Event Model (Draft)

All future shared reporting should derive from these event families:

1. Booking lifecycle
- Booking created
- Booking confirmed
- Booking completed
- Booking no-show
- Booking cancelled
- Waitlist join/convert

2. Attendance and capacity
- Class session created
- Session capacity changes
- Attended booking count
- Fill rate

3. Revenue
- Direct payment captured
- Subscription payment captured
- Credit pack purchase
- Credit usage
- Refund or reversal

4. Client lifecycle
- Client created
- New client booking
- Repeat booking
- Churn / at-risk threshold crossing

5. Teacher performance
- Teacher-led session
- Teacher revenue attribution
- Teacher fill/completion metrics
- Teacher repeat-client retention contribution

6. Marketing events
- Email sent
- Email opened
- Email clicked
- SMS sent
- Marketing-attributed booking
- No-show reminder / win-back outcome

7. Website analytics
- Page view
- Visitor session
- Source attribution
- Conversion
- Device/browser breakdown

8. Social events
- Social account connected
- Social flow event triggered
- Social response recorded
- Social booking recorded
- Social content/post activity

9. Vault events
- Course published
- Enrollment
- Lesson progress
- Course completion
- Subscription enrollment
- Affiliate sale
- Community message

10. Class Flows / training events
- Content created
- Content progress
- Training request created
- Training request approved/denied
- In-house training scheduled

11. Leaderboard events
- Period started
- Period ended
- Entry scored
- Entry re-ranked
- Override/custom period applied

## Reporting / Analytics Surfaces

### A. Studio Owner Surfaces

Primary:

- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/studio/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/components/studio/DashboardView.tsx`
- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/studio/reports/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`

Secondary analytics:

- `/Users/charlie/Development/pilates-v4/src/app/api/studio/website-analytics/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/studio/leaderboards/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/components/studio/LeaderboardsView.tsx`
- `/Users/charlie/Development/pilates-v4/src/components/studio/VaultView.tsx`

Likely dependent modules:

- bookings / schedule
- teacher performance
- client retention
- marketing attribution
- website analytics
- social metrics
- vault analytics
- leaderboards

### B. Teacher Surfaces

Primary:

- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/teacher/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/teacher/reports/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`

Additional data-linked surfaces:

- `/Users/charlie/Development/pilates-v4/src/app/(dashboard)/teacher/schedule/[classId]/page.tsx`
- `/Users/charlie/Development/pilates-v4/src/app/api/teacher/schedule/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/teacher/schedule/[classId]/route.ts`

### C. Mobile Surfaces

Native app:

- `/Users/charlie/Development/pilates-v4/mobile/app/(app)/index.tsx`
- `/Users/charlie/Development/pilates-v4/mobile/app/(app)/reports.tsx`
- `/Users/charlie/Development/pilates-v4/mobile/app/(app)/reports/[metricId].tsx`
- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/reports/route.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/reporting/mobile-reports.ts`

Related mobile summaries:

- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/leaderboards/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/class-flows/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/vault/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/mobile/marketing/route.ts`

### D. Entity-Level Reporting Surfaces

These need a dedicated audit because they often use bespoke logic:

- teacher profile pages under studio admin
- client profile pages under studio admin
- class type detail pages
- location detail pages
- invoice summaries

Key routes:

- `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/classes/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/clients/[clientId]/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-types/[classTypeId]/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/locations/[locationId]/route.ts`

### E. Leaderboards

Main route:

- `/Users/charlie/Development/pilates-v4/src/app/api/leaderboards/route.ts`

Core scoring:

- `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/scoring.ts`
- `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/cycle.ts`

Dependencies already visible in scoring:

- bookings
- revenue
- new clients
- social posts / engagement
- vault enrollments / reviews / chat / affiliate sales

This is a major cross-module dependency surface and cannot be refactored casually.

Current note:

- Low-risk score sub-calculations are now being centralized in `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/metrics.ts` while the existing scoring route remains the source of truth.

### F. Class Flows

Core API routes:

- `/Users/charlie/Development/pilates-v4/src/app/api/class-flows/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/class-flows/[contentId]/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/class-flows/[contentId]/progress/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/class-flows/training-requests/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-flows/admin/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-flows/content/route.ts`

Analytics-like surfaces:

- training requests
- completion/progress
- admin summaries

Current note:

- Low-risk summary math is now being centralized in `/Users/charlie/Development/pilates-v4/src/lib/class-flows/analytics.ts` before any deeper route consolidation.

### G. The Vault

Core routes:

- `/Users/charlie/Development/pilates-v4/src/app/api/vault/courses/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/courses/[courseId]/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/enrollments/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/subscription/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/affiliates/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/chat/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/vault/subscription/chat/route.ts`

Surface:

- `/Users/charlie/Development/pilates-v4/src/components/studio/VaultView.tsx`

Current note:

- Vault analytics UI exists, but some of it still appears placeholder-like and needs an explicit audit before unification.
- Low-risk summary math is now being centralized in `/Users/charlie/Development/pilates-v4/src/lib/vault/analytics.ts` before any deeper route consolidation.

### H. Marketing / Email / SMS / Social

Low-risk shared summary math is now being centralized for:

- website overview rates in `/Users/charlie/Development/pilates-v4/src/lib/website-analytics/metrics.ts`
- campaign and automation delivery/open/click/failure rates in `/Users/charlie/Development/pilates-v4/src/lib/marketing/analytics.ts`

Studio marketing routes:

- `/Users/charlie/Development/pilates-v4/src/app/api/studio/campaigns/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/automations/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/messages/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/studio/messages/bulk/route.ts`

Social routes:

- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/accounts/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/flows/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/tracking/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/trending/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/hooks/route.ts`
- `/Users/charlie/Development/pilates-v4/src/app/api/social-media/homework/route.ts`

Studio reports page already composes marketing and social summaries. Those need to be brought under the same canonical event rules.

## Current Major Risks

1. Split engines
- Studio reports, teacher stats, mobile reports, website analytics, and leaderboards each still have their own calculation path.

2. Date-range mismatch risk
- `studio/reports`
- `teacher/stats`
- `mobile/reports`
- dashboard summary surfaces
may not all resolve “today”, “this month”, and custom ranges identically.

3. Entity-level divergence
- Profile tabs for teachers/clients/classes/locations may use bespoke queries and not match the main reports page for equivalent scopes.

4. Cross-module coupling
- Leaderboards already read from bookings, social, and vault data.
- Any reporting refactor that changes definitions can silently change leaderboard rankings.

5. Placeholder or UI-only analytics
- Vault and class-flows surfaces may contain summary cards that need explicit verification before they are treated as hard business metrics.

## Safe Migration Order

1. Lock current desktop outputs with parity tests.
2. Normalize date-range resolution as a shared primitive.
3. Extract shared metric primitives (revenue, fill, retention, attribution).
4. Refactor studio desktop reports onto those primitives without changing output.
5. Align dashboard summaries to studio reports.
6. Align teacher reporting.
7. Align entity profile reporting.
8. Align mobile reporting.
9. Align marketing / website / social.
10. Align leaderboards.
11. Align vault and class-flows analytics.

## Immediate Next Audit Targets

These are the next files to inspect and baseline:

1. `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
2. `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`
3. `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/route.ts`
4. `/Users/charlie/Development/pilates-v4/src/app/api/studio/clients/[clientId]/route.ts`
5. `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-types/[classTypeId]/route.ts`
6. `/Users/charlie/Development/pilates-v4/src/app/api/studio/locations/[locationId]/route.ts`
7. `/Users/charlie/Development/pilates-v4/src/app/api/studio/website-analytics/route.ts`
8. `/Users/charlie/Development/pilates-v4/src/app/api/leaderboards/route.ts`
9. `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/scoring.ts`
10. `/Users/charlie/Development/pilates-v4/src/components/studio/VaultView.tsx`

## Baseline Capture Harness

Repeatable baseline capture script:

- `/Users/charlie/Development/pilates-v4/scripts/tests/reporting-baseline-capture.mjs`

Package script:

- `pnpm test:baseline:reporting`
- `pnpm test:baseline:reporting:compare`
- `pnpm test:reporting:date-range`
- `pnpm test:smoke:reporting`

Supported env inputs:

- `TEST_BASE_URL`
- `TEST_OWNER_COOKIE`
- `TEST_TEACHER_COOKIE`
- `TEST_STUDIO_CLIENT_ID`
- `TEST_STUDIO_TEACHER_ID`
- `TEST_STUDIO_CLASS_ID`
- `TEST_STUDIO_LOCATION_ID`
- `REPORTING_BASELINE_OUTPUT`

Current baseline coverage:

- studio reports (`today`, `last7`, `last30`)
- reporting integrity (`30d`)
- teacher stats
- entity summaries (client / teacher / class type / location) when IDs are provided
- website analytics (`7d`, `30d`)
- leaderboards (`STUDIO`, `TEACHER`)
- content surfaces:
  - class flows
  - social training / Growth Academy
  - vault courses

This script is intentionally read-only. It captures the current trusted output shape and summary values so future refactors can be compared against a concrete baseline before any route is switched.

Companion compare harness:

- `/Users/charlie/Development/pilates-v4/scripts/tests/reporting-baseline-compare.mjs`

Required env for compare:

- `REPORTING_BASELINE_INPUT`
- same auth and entity-ID env vars used by baseline capture

The compare script re-fetches the same trusted surfaces and fails if the summarized outputs drift from the recorded baseline beyond a small numeric tolerance.

The reporting smoke entrypoint now also runs the shared date-range logic test first, so range semantics are pinned before any route-level checks run.

Current shared primitive adoption:

- Date range:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/mobile/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/integrity/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-types/[classTypeId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/clients/[clientId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/locations/[locationId]/route.ts`
- Revenue attribution:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/mobile/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/class-types/[classTypeId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/clients/[clientId]/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/locations/[locationId]/route.ts`
- Studio report revenue composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Studio report bookings composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Studio report classes composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Studio report retention composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Studio report instructor composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Attendance / fill:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/mobile/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`
- Retention / churn:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/teacher/stats/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/teachers/[teacherId]/route.ts`
- Studio report marketing composition:
  - `/Users/charlie/Development/pilates-v4/src/app/api/studio/reports/route.ts`
- Leaderboard presentation / participant counts:
  - `/Users/charlie/Development/pilates-v4/src/lib/leaderboards/scoring.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/leaderboards/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/mobile/leaderboards/route.ts`
  - `/Users/charlie/Development/pilates-v4/src/app/api/mobile/leaderboards/[leaderboardId]/route.ts`

## Non-Negotiable Safety Constraint

No behavior-changing refactor should land until:

- the surface is inventoried
- the current output is captured
- parity checks exist
- cross-module dependencies are identified

This is the only defensible way to unify reporting across desktop, mobile, profiles, leaderboards, class flows, and the vault without breaking trusted production behavior.
