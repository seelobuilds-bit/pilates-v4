# Mobile Audit

Generated: 2026-02-17T19:46:41.791Z

## Section Risk Summary

| Section | Files | Risk Score |
|---|---:|---:|
| Studio | 43 | 487 |
| Teacher | 16 | 195 |
| Demo | 23 | 166 |
| HQ | 14 | 130 |
| Shared | 7 | 72 |
| Booking | 14 | 57 |
| Sales | 7 | 49 |
| Home | 2 | 42 |
| Auth | 6 | 1 |

## Highest-Risk Files

| Score | File | Signals |
|---:|---|---|
| 45 | `src/app/(dashboard)/studio/reports/page.tsx` | fixedWidth:2, desktopPad:3, wideTable:3, justifyBetween:27 |
| 39 | `src/app/page.tsx` | fixedWidth:3, desktopPad:8, desktopSplit:2, justifyBetween:8 |
| 39 | `src/app/(dashboard)/teacher/social/page.tsx` | fixedWidth:6, minWidth:1, desktopPad:2, justifyBetween:14 |
| 36 | `src/app/(dashboard)/studio/marketing/social/page.tsx` | fixedWidth:6, minWidth:1, desktopPad:2, justifyBetween:11 |
| 26 | `src/app/(dashboard)/studio/schedule/page.tsx` | fixedWidth:4, minWidth:3, desktopPad:1, hardCols7:1 |
| 25 | `src/components/studio/DashboardView.tsx` | fixedWidth:1, minWidth:1, desktopPad:1, justifyBetween:17 |
| 24 | `src/app/(dashboard)/hq/studios/[studioId]/page.tsx` | fixedWidth:2, desktopPad:2, wideTable:1, justifyBetween:12 |
| 23 | `src/app/(dashboard)/hq/analytics/page.tsx` | desktopPad:1, wideTable:1, justifyBetween:19 |
| 23 | `src/app/(dashboard)/studio/schedule/[classId]/page.tsx` | fixedWidth:4, desktopPad:3, justifyBetween:5 |
| 22 | `src/app/(dashboard)/teacher/inbox/page.tsx` | fixedHeightVh:2, desktopSplit:2, justifyBetween:8 |
| 22 | `src/app/(dashboard)/studio/marketing/campaigns/new/page.tsx` | fixedWidth:1, minWidth:1, desktopPad:6, justifyBetween:4 |
| 21 | `src/components/studio/LeaderboardsView.tsx` | fixedWidth:2, fixedHeightVh:1, desktopPad:1, justifyBetween:9 |
| 21 | `src/app/(dashboard)/teacher/leaderboards/page.tsx` | fixedWidth:2, fixedHeightVh:1, desktopPad:1, justifyBetween:9 |
| 21 | `src/app/(dashboard)/studio/leaderboards/page.tsx` | fixedWidth:2, fixedHeightVh:1, desktopPad:1, justifyBetween:9 |
| 20 | `src/app/(dashboard)/studio/vault/page.tsx` | fixedHeightVh:2, desktopPad:1, justifyBetween:10 |
| 20 | `src/app/(dashboard)/studio/teachers/[teacherId]/page.tsx` | desktopPad:3, hardCols7:1, justifyBetween:11 |
| 18 | `src/app/(dashboard)/hq/sales/page.tsx` | desktopPad:1, wideTable:2, desktopSplit:2, justifyBetween:6 |
| 18 | `src/app/(dashboard)/studio/vault/[courseId]/page.tsx` | fixedHeightVh:1, desktopPad:2, justifyBetween:10 |
| 17 | `src/app/(booking)/[subdomain]/account/page.tsx` | desktopPad:3, justifyBetween:11 |
| 17 | `src/app/(dashboard)/studio/clients/[clientId]/page.tsx` | desktopPad:3, justifyBetween:11 |
| 16 | `src/app/(dashboard)/teacher/vault/page.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:10 |
| 16 | `src/app/demo/settings/page.tsx` | desktopPad:3, justifyBetween:10 |
| 15 | `src/components/studio/VaultView.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:9 |
| 15 | `src/app/(dashboard)/sales/calendar/page.tsx` | fixedWidth:1, minWidth:1, desktopPad:1, hardCols7:2, justifyBetween:1 |
| 15 | `src/app/(dashboard)/studio/payments/page.tsx` | desktopPad:7, justifyBetween:1 |
| 15 | `src/app/(dashboard)/studio/classes/[classTypeId]/page.tsx` | desktopPad:3, justifyBetween:9 |
| 14 | `src/app/(dashboard)/studio/marketing/segments/[segmentId]/page.tsx` | fixedWidth:1, minWidth:1, desktopPad:3, wideTable:1 |
| 14 | `src/app/(dashboard)/studio/settings/email/page.tsx` | fixedWidth:2, desktopPad:2, wideTable:1, justifyBetween:2 |
| 14 | `src/app/(dashboard)/studio/inbox/page.tsx` | desktopSplit:2, justifyBetween:8 |
| 13 | `src/app/(dashboard)/teacher/invoices/page.tsx` | fixedHeightVh:1, desktopPad:1, wideTable:1, justifyBetween:5 |
| 13 | `src/app/(dashboard)/sales/page.tsx` | desktopPad:1, wideTable:1, desktopSplit:2, justifyBetween:3 |
| 13 | `src/app/(dashboard)/studio/store/catalog/[productId]/page.tsx` | fixedHeightVh:1, desktopPad:2, justifyBetween:5 |
| 13 | `src/app/(booking)/[subdomain]/embed/page.tsx` | desktopPad:2, justifyBetween:9 |
| 13 | `src/app/demo/teachers/[teacherId]/page.tsx` | desktopPad:1, hardCols7:1, justifyBetween:8 |
| 13 | `src/app/(booking)/[subdomain]/book/page.tsx` | desktopPad:2, justifyBetween:9 |
| 13 | `src/app/(dashboard)/studio/invoices/page.tsx` | fixedHeightVh:1, desktopPad:1, wideTable:1, justifyBetween:5 |
| 13 | `src/app/demo/clients/[clientId]/page.tsx` | desktopPad:1, justifyBetween:11 |
| 12 | `src/app/(dashboard)/teacher/schedule/[classId]/page.tsx` | fixedWidth:1, desktopPad:3, justifyBetween:3 |
| 12 | `src/app/(dashboard)/teacher/class-flows/page.tsx` | desktopPad:4, justifyBetween:4 |
| 12 | `src/app/(dashboard)/studio/store/page.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:6 |
| 12 | `src/app/(dashboard)/studio/class-flows/page.tsx` | desktopPad:2, justifyBetween:8 |
| 12 | `src/app/(dashboard)/studio/marketing/templates/[templateId]/page.tsx` | fixedWidth:1, desktopPad:3, justifyBetween:3 |
| 12 | `src/app/(dashboard)/studio/clients/page.tsx` | fixedWidth:1, minWidth:1, desktopPad:2, wideTable:1 |
| 12 | `src/app/demo/class-flows/page.tsx` | desktopPad:1, justifyBetween:10 |
| 11 | `src/components/studio/MarketingView.tsx` | desktopPad:1, justifyBetween:9 |
| 11 | `src/app/(dashboard)/hq/support/page.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:5 |
| 11 | `src/app/demo/classes/[classTypeId]/page.tsx` | desktopPad:1, justifyBetween:9 |
| 11 | `src/app/(dashboard)/studio/marketing/automations/[automationId]/page.tsx` | fixedWidth:2, desktopPad:2, justifyBetween:1 |
| 11 | `src/app/demo/inbox/page.tsx` | fixedHeightVh:1, desktopPad:2, justifyBetween:3 |
| 10 | `src/app/(dashboard)/teacher/community/page.tsx` | fixedHeightVh:2, desktopPad:1 |
| 10 | `src/app/(dashboard)/teacher/schedule/page.tsx` | desktopPad:1, hardCols7:1, justifyBetween:5 |
| 10 | `src/app/(dashboard)/teacher/clients/[clientId]/page.tsx` | fixedHeightVh:1, desktopPad:1, desktopSplit:1, justifyBetween:1 |
| 10 | `src/app/(dashboard)/studio/locations/[locationId]/page.tsx` | desktopPad:3, justifyBetween:4 |
| 10 | `src/app/demo/community/page.tsx` | fixedHeightVh:1, desktopPad:2, justifyBetween:2 |
| 10 | `src/app/demo/schedule/page.tsx` | desktopPad:2, hardCols7:1, justifyBetween:3 |
| 9 | `src/app/(dashboard)/teacher/vault/[courseId]/page.tsx` | fixedHeightVh:1, desktopPad:2, justifyBetween:1 |
| 9 | `src/app/(dashboard)/studio/marketing/automations/new/page.tsx` | fixedWidth:2, desktopPad:1, justifyBetween:1 |
| 8 | `src/app/(dashboard)/hq/leaderboards/page.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:2 |
| 8 | `src/app/(dashboard)/hq/training/page.tsx` | desktopPad:1, justifyBetween:6 |
| 8 | `src/app/(dashboard)/sales/demos/page.tsx` | desktopPad:1, wideTable:2, justifyBetween:2 |
| 8 | `src/app/demo/locations/page.tsx` | fixedWidth:1, desktopPad:2, justifyBetween:1 |
| 8 | `src/app/(dashboard)/studio/marketing/campaigns/[campaignId]/page.tsx` | desktopPad:2, justifyBetween:4 |
| 7 | `src/app/(dashboard)/teacher/page.tsx` | desktopPad:1, justifyBetween:5 |
| 7 | `src/app/(dashboard)/hq/sales/calendar/page.tsx` | desktopPad:1, hardCols7:1, justifyBetween:2 |
| 7 | `src/app/(dashboard)/hq/inbox/page.tsx` | fixedHeightVh:1, desktopSplit:1 |
| 7 | `src/app/(dashboard)/hq/settings/page.tsx` | desktopPad:1, justifyBetween:5 |
| 7 | `src/app/(dashboard)/studio/store/catalog/page.tsx` | fixedHeightVh:1, desktopPad:1, justifyBetween:1 |
| 7 | `src/app/demo/store/page.tsx` | desktopPad:2, justifyBetween:3 |
| 7 | `src/app/demo/reports/page.tsx` | desktopPad:2, justifyBetween:3 |
| 6 | `src/app/(dashboard)/teacher/reports/page.tsx` | desktopPad:1, justifyBetween:4 |
| 6 | `src/app/(dashboard)/hq/sales/leads/[leadId]/page.tsx` | desktopPad:2, justifyBetween:2 |
| 6 | `src/app/(dashboard)/sales/leads/[leadId]/page.tsx` | desktopPad:2, justifyBetween:2 |
| 6 | `src/app/demo/teachers/page.tsx` | desktopPad:2, justifyBetween:2 |
| 6 | `src/app/(dashboard)/studio/community/page.tsx` | fixedHeightVh:1, desktopPad:1 |
| 6 | `src/app/demo/classes/page.tsx` | desktopPad:2, justifyBetween:2 |
| 6 | `src/app/demo/locations/[locationId]/page.tsx` | desktopPad:1, justifyBetween:4 |
| 6 | `src/app/(dashboard)/studio/marketing/templates/new/page.tsx` | fixedWidth:1, desktopPad:1, justifyBetween:1 |
| 6 | `src/app/demo/payments/page.tsx` | desktopPad:2, justifyBetween:2 |
| 6 | `src/app/demo/clients/page.tsx` | desktopPad:2, justifyBetween:2 |
| 5 | `src/app/(dashboard)/hq/page.tsx` | desktopPad:1, justifyBetween:3 |

## Notes

- Risk score is heuristic (high score = likely mobile breakage risk).
- This does not replace real-device testing, but it catches most desktop-first layout patterns quickly.

## Remediation Progress

- 2026-02-17 Batch A complete:
  - `src/app/(dashboard)/studio/inbox/page.tsx`
  - `src/components/studio/DashboardView.tsx`
- 2026-02-17 Batch B complete:
  - `src/app/(dashboard)/teacher/inbox/page.tsx`
  - `src/app/(dashboard)/hq/inbox/page.tsx`
  - `src/app/(dashboard)/studio/clients/[clientId]/page.tsx`
  - `src/app/(dashboard)/studio/reports/page.tsx`
  - `src/app/(dashboard)/studio/schedule/page.tsx`
- 2026-02-17 Batch C complete:
  - `src/app/(dashboard)/teacher/social/page.tsx`
  - `src/app/(dashboard)/studio/marketing/social/page.tsx`
- 2026-02-17 Batch D complete:
  - `src/app/(dashboard)/hq/analytics/page.tsx`
  - `src/app/(dashboard)/hq/studios/[studioId]/page.tsx`
- 2026-02-17 Batch E complete:
  - `src/app/page.tsx`
  - `src/app/(dashboard)/teacher/schedule/page.tsx`
  - `src/app/(dashboard)/teacher/clients/[clientId]/page.tsx`
- 2026-02-17 Batch F complete:
  - `src/app/(dashboard)/teacher/reports/page.tsx`
  - `src/app/(dashboard)/teacher/leaderboards/page.tsx`
  - `src/app/(dashboard)/teacher/vault/page.tsx`
- 2026-02-17 Batch G complete:
  - `src/app/(dashboard)/teacher/vault/[courseId]/page.tsx`
  - `src/app/(dashboard)/teacher/invoices/page.tsx`
  - `src/app/(dashboard)/teacher/community/page.tsx`
  - `src/components/vault/subscription-chat.tsx`
  - `src/components/vault/course-chat.tsx`
- 2026-02-17 Batch H complete:
  - `src/app/(dashboard)/studio/teachers/[teacherId]/page.tsx`
  - `src/app/(dashboard)/studio/vault/[courseId]/page.tsx`
  - `src/app/(dashboard)/studio/marketing/campaigns/new/page.tsx`
- 2026-02-17 Batch I complete:
  - `src/app/(dashboard)/studio/schedule/[classId]/page.tsx`
  - `src/app/(dashboard)/studio/settings/email/page.tsx`
  - `src/app/(dashboard)/studio/marketing/segments/[segmentId]/page.tsx`
- 2026-02-17 Batch J complete:
  - `src/app/(dashboard)/studio/classes/[classTypeId]/page.tsx`
  - `src/app/(dashboard)/studio/store/catalog/[productId]/page.tsx`
  - `src/app/(dashboard)/studio/settings/emails/page.tsx`
- 2026-02-17 Batch K complete:
  - `src/app/demo/settings/page.tsx`
  - `src/app/demo/inbox/page.tsx`
  - `src/app/demo/community/page.tsx`
- 2026-02-17 Batch L complete:
  - `src/app/demo/payments/page.tsx`
  - `src/app/demo/clients/[clientId]/page.tsx`
  - `src/app/demo/teachers/[teacherId]/page.tsx`
- 2026-02-17 Batch M complete:
  - `src/app/demo/invoices/page.tsx`
  - `src/app/demo/locations/[locationId]/page.tsx`
  - `src/app/demo/schedule/[classId]/page.tsx`
- 2026-02-17 Batch N complete:
  - `src/app/demo/reports/page.tsx`
  - `src/app/demo/store/page.tsx`
  - `src/app/demo/classes/[classTypeId]/page.tsx`
- 2026-02-17 Batch O complete:
  - `src/app/demo/classes/page.tsx`
  - `src/app/demo/clients/page.tsx`
  - `src/app/demo/locations/page.tsx`
- 2026-02-17 Batch P complete:
  - `src/app/demo/class-flows/page.tsx`
  - `src/app/demo/teachers/page.tsx`
  - `src/app/demo/marketing/page.tsx`
- 2026-02-17 Batch Q complete:
  - `src/app/(dashboard)/studio/store/page.tsx`
  - `src/app/(dashboard)/studio/clients/page.tsx`
  - `src/app/(dashboard)/teacher/class-flows/page.tsx`
- 2026-02-17 Batch R complete:
  - `src/app/(dashboard)/studio/class-flows/page.tsx`
  - `src/app/(dashboard)/teacher/schedule/[classId]/page.tsx`
  - `src/app/(dashboard)/studio/marketing/templates/[templateId]/page.tsx`
- 2026-02-17 Batch S complete:
  - `src/app/(dashboard)/teacher/page.tsx`
  - `src/app/(dashboard)/hq/training/page.tsx`
  - `src/app/(dashboard)/sales/demos/page.tsx`
- 2026-02-17 Batch T complete:
  - `src/app/(dashboard)/hq/sales/calendar/page.tsx`
  - `src/app/(dashboard)/hq/settings/page.tsx`
  - `src/app/(dashboard)/sales/leads/[leadId]/page.tsx`
- 2026-02-17 Batch U complete:
  - `src/app/(booking)/[subdomain]/book/page.tsx`
  - `src/app/(booking)/[subdomain]/embed/page.tsx`
  - `src/app/(booking)/[subdomain]/account/page.tsx`
- 2026-02-17 Batch V complete:
  - `src/app/(dashboard)/studio/vault/page.tsx`
  - `src/components/studio/VaultView.tsx`
  - `src/app/(dashboard)/studio/leaderboards/page.tsx`

## Next Priority Queue

- `src/app/(dashboard)/hq/sales/page.tsx`
- `src/app/(dashboard)/sales/page.tsx`
- `src/app/(dashboard)/studio/payments/page.tsx`
