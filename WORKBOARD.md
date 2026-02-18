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
| T-121 Reporting regression smoke tests | mac-mini-agent | mini/T-121-reporting-smoke-tests | `scripts/tests/**`, `package.json`, `WORKBOARD.md` status update only | Needs Review | — |

## Merge Order
1. T-121 Reporting regression smoke tests

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
