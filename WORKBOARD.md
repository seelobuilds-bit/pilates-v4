# WORKBOARD

## Objective
Ship high-impact improvements in parallel without conflicts.

## Active Tasks
| Task | Owner | Branch | Scope | Status | PR |
|---|---|---|---|---|---|
| T-101 Dashboard widgets (drag/drop + save layout) | mac-mini-agent | mini/T-101-dashboard-widgets | `src/app/(dashboard)/studio/page.tsx`, `src/components/studio/**` (widget files only) | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/10 |
| T-102 Sidebar click bug (multi-click issue) | codex-main | codex/T-102-sidebar-click-bug | `src/components/layout/sidebar.tsx` + related nav handlers only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/11, https://github.com/seelobuilds-bit/pilates-v4/pull/14 |
| T-103 Sidebar IA redesign (clean groups/submenus, no feature removal) | codex-main | codex/T-103-sidebar-ia-redesign | Studio sidebar UI/IA only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/16 |
| T-104 Mobile optimization (studio app) | codex-main | codex/T-104-mobile-pass | Responsive behavior for studio routes only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/18 |
| T-105 Studio currency setting + formatting | codex-main | codex/T-105-currency-setting | Studio settings + currency formatting usage | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/17 |
| T-106 Marketing automation chains (phase 1) | codex-main | codex/T-106-automation-chains-phase1 | Automation schema/API/UI first slice only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/22 |
| T-107 Dashboard report datapoints + per-card visibility | mac-mini-agent | mini/T-107-dashboard-reporting-widgets | `src/components/studio/DashboardView.tsx` + related dashboard widget config/types only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/13 |
| T-108 Demo reports preview build stability | codex-main | codex/T-108-demo-reports-build-stability | `/demo/reports` rendering mode only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/15 |
| T-109 Studio schedule list view (toggle with existing calendar) | mac-mini-agent | mini/T-109-schedule-list-view | `src/app/(dashboard)/studio/schedule/page.tsx` (+ minimal extracted components under `src/components/studio/schedule/**` only if needed) | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/21 |
| T-110 Marketing automation chains phase 2 (real step model + runner) | codex-main | codex/T-110-automation-chains-backend | `prisma/schema.prisma`, automation APIs, worker runtime | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/24 |
| T-111 Schedule list UX parity (filters + sticky header + actions polish) | mac-mini-agent | mini/T-111-schedule-list-ux-parity | `src/app/(dashboard)/studio/schedule/page.tsx`, `src/components/studio/schedule/**` only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/25 |
| T-112 Schedule view simplify (revert day/week/month chips) | mac-mini-agent | mini/T-112-schedule-view-simplify | `src/app/(dashboard)/studio/schedule/page.tsx` only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/26 |
| T-113 Automation edit multi-step parity | codex-main | codex/T-113-automation-edit-multistep | `src/app/(dashboard)/studio/marketing/automations/[automationId]/page.tsx` | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/27 |
| T-114 Owner flow smoke tests | mac-mini-agent | mini/T-114-owner-smoke-tests | `scripts/tests/**`, `package.json`, docs notes only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/28 |
| T-115 Reporting integrity + empty-state correctness | codex-main | codex/T-115-reporting-integrity-empty-states | Reporting APIs/UI for studio reports + entity report tabs | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/29 |
| T-117 Mobile hardening core pass (studio owner, non-marketing) | codex-main | codex/T-117-mobile-hardening-core | Studio owner layout + non-marketing route responsiveness + support widget mobile behavior | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/31, https://github.com/seelobuilds-bit/pilates-v4/pull/32, https://github.com/seelobuilds-bit/pilates-v4/pull/33 |
| T-118 Reporting backend integrity (studio + teacher) | codex-main | codex/T-118-reporting-backend-integrity | Reporting APIs and teacher reporting surfaces: bounded windows, remove mock values, canonical metrics | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/34 |
| T-119 Reporting integrity phase 2 (marketing/social/leaderboards) | codex-main | codex/T-119-reporting-integrity-phase2 | Backend reporting correctness for marketing + social attribution metrics and leaderboard rank stability | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/35 |
| T-120 Reporting UI truth-source wiring | codex-main | codex/T-120-reporting-ui-truth-source | Studio reports page: wire marketing/social cards to backend metrics and eliminate placeholder UI values | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/37 |
| T-121 Reporting regression smoke tests | mac-mini-agent | mini/T-121-reporting-smoke-tests | `scripts/tests/**`, `package.json`, `WORKBOARD.md` status update only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/38 |
| T-122 Reporting depth fillers (instructors + retention detail) | codex-main | codex/T-122-reporting-depth-fillers | `/api/studio/reports` instructor/retention metrics + `/studio/reports` wiring and empty-state clarity | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/39 |
| T-124 Reporting smoke CI pipeline | mac-mini-agent | mini/T-124-reporting-smoke-ci | `.github/workflows/reporting-smoke.yml`, `WORKBOARD.md` only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/40 |
| T-125 Reporting empty-state/rating clarity (teacher surfaces) | codex-main | codex/T-125-reporting-empty-state-ratings | Teacher dashboard/reporting: explicit unavailable rating/review states and reporting UX polish | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/41 |
| T-126 Supabase RLS baseline and security codification | codex-main | codex/T-126-supabase-rls-baseline | SQL + scripts/docs to codify RLS defaults for Supabase public schema | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/42 |
| T-127 Automation chain stop-condition UX polish | mac-mini-agent | mini/T-127-automation-chain-conditions | Automation create/edit UX wording and delay validation polish | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/43 |
| T-128 Social attribution tracking (booking + reports integrity) | codex-main | codex/T-128-social-attribution-tracking | Preserve `sf_track`, count click/conversion/revenue, and wire attribution through booking APIs | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/44 |
| T-129 Reporting rating/review placeholder cleanup | codex-main | codex/T-129-reporting-rating-placeholders | Remove hardcoded rating placeholders and present explicit unavailable states across studio/teacher reporting APIs + UI | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/45 |
| T-130 Teacher invoice earnings placeholder fix | codex-main | codex/T-130-invoice-earnings-placeholder-fix | Replace `PERCENTAGE` payout placeholder with real revenue-based calculation (exclude cancelled bookings) | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/46 |
| T-131 Leaderboard user-rank null-state integrity | codex-main | codex/T-131-leaderboard-rank-null-fix | Avoid emitting rank `0`; return `null` for not-yet-ranked participants so UI shows correct empty state | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/47 |
| T-132 Reports custom date-range integrity | codex-main | codex/T-132-reports-custom-date-range-integrity | Ensure studio reports custom range sends/uses explicit `startDate` + `endDate` and aligns previous-period calculations to selected span | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/48 |
| T-133 Teacher reporting studio-scope enforcement | codex-main | codex/T-133-teacher-reporting-studio-scope | Enforce `studioId` scoping in teacher reporting APIs to prevent cross-tenant metric bleed and keep report totals tenant-correct | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/49 |
| T-134 Reporting monthly bucket date alignment | codex-main | codex/T-134-reporting-monthly-bucket-date-alignment | Align client/class/location monthly trend buckets to class session dates so reporting charts reflect operational periods | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/50 |
| T-135 Reporting smoke entity-id auto-resolve | codex-main | codex/T-135-reporting-smoke-entity-id-autoresolve | Auto-resolve missing client/teacher/class/location IDs from studio list endpoints so reporting smoke checks do not skip when one ID secret is missing | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/51 |
| T-136 Reporting consistency smoke checks | codex-main | codex/T-136-reporting-consistency-smoke-checks | Add strict reporting invariants in smoke tests (range validity, totals reconciliation, rate bounds, conversion math) to catch metric drift | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/52 |
| T-137 Entity report period parity | mac-mini-agent | mini/T-137-entity-report-period-parity | Add period selector + custom date ranges on entity report tabs and wire APIs to respect selected windows | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/54 |
| T-138 Reporting metric math hardening | codex-main | codex/T-138-reporting-metric-math-hardening | Centralize percentage/currency math helpers and use them in reporting APIs to enforce bounded, consistent metric outputs | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/53 |
| T-139 Entity report period smoke validation | codex-main | codex/T-139-entity-report-period-smoke-validation | Extend reporting smoke with entity-level window checks (`days`/custom/fallback + monotonic windows) so period regressions fail CI | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/55 |
| T-140 Reporting completeness pass (remaining surfaces) | codex-main | codex/T-140-reporting-completeness-pass | Verify/fix reporting + tracking for website analytics/social hub/marketing automations/leaderboards, enforce empty states, and add smoke coverage | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/56 |

## Merge Order
1. None currently queued

## Rules (Mandatory)
1. One task = one branch = one PR.
2. No two active tasks may edit the same files.
3. Rebase on latest `main` before requesting final review.
4. CI must pass before merge.
5. Merge one PR at a time.
6. No direct pushes to `main`.

## PR Checklist
1. Summary of what changed.
2. Exact file list touched.
3. Test steps + results.
4. Screenshots/video for UI changes.
5. Known risks/limitations.

## Status Updates (Per Task)
- In Progress
- Needs Review
- Changes Requested
- Ready to Merge
- Merged
