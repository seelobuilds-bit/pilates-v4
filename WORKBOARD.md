# WORKBOARD

## Objective
Ship high-impact improvements in parallel without conflicts.

## Active Tasks
| Task | Owner | Branch | Scope | Status | PR |
|---|---|---|---|---|---|
| T-101 Dashboard widgets (drag/drop + save layout) | mac-mini-agent | mini/T-101-dashboard-widgets | `src/app/(dashboard)/studio/page.tsx`, `src/components/studio/**` (widget files only) | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/10 |
| T-102 Sidebar click bug (multi-click issue) | codex-main | codex/T-102-sidebar-click-bug | `src/components/layout/sidebar.tsx` + related nav handlers only | Merged | https://github.com/seelobuilds-bit/pilates-v4/pull/11 |
| T-103 Sidebar IA redesign (clean groups/submenus, no feature removal) | codex-main | codex/T-103-sidebar-ia-redesign | Studio sidebar UI/IA only | Ready | |
| T-104 Mobile optimization (studio app) | codex-main | codex/T-104-mobile-pass | Responsive behavior for studio routes only | Blocked by T-103 | |
| T-105 Studio currency setting + formatting | codex-main | codex/T-105-currency-setting | Studio settings + currency formatting usage | Ready | |
| T-106 Marketing automation chains (phase 1) | codex-main | codex/T-106-automation-chains-phase1 | Automation schema/API/UI first slice only | Ready | |

## Merge Order
1. T-102
2. T-103
3. T-104
4. T-101 (must rebase after T-103/T-104)
5. T-105
6. T-106

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
