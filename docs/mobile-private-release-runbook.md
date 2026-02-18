# Mobile Private Release Runbook (Studio Rollout)

This runbook covers private distribution of studio-branded mobile apps from the shared `mobile/` codebase.

## Scope

- iOS private distribution via **Apple Business Manager Custom Apps**
- Android private distribution via **Managed Google Play private apps**
- Decision framework for **new binary vs EAS Update**

## Preconditions

- Studio env values prepared (`mobile/.env.local` or CI secrets)
- Unique iOS bundle ID + Android package per studio
- Privacy/terms/support metadata ready (see `docs/mobile-compliance-checklist.md`)
- EAS credentials and org access confirmed

---

## A) iOS — Apple Business Manager Custom Apps

1. **Prepare studio config**
   - Set studio env values (`EXPO_PUBLIC_STUDIO_NAME`, `EXPO_PUBLIC_STUDIO_SUBDOMAIN`, branding)
   - Confirm bundle identifier matches studio app record

2. **Build production binary**
   - Build iOS with EAS for production profile
   - Validate app launches, auth works, profile/account handoff links resolve

3. **Submit in App Store Connect**
   - Upload build and complete metadata
   - Set distribution as private/custom app for ABM
   - Add review notes (private distribution context + login/deletion handoff)

4. **Assign in Apple Business Manager**
   - After approval, assign app to target organization(s)
   - Confirm app visibility in org-managed catalog

5. **Post-release validation**
   - Install through ABM-managed device/account
   - Smoke test login, schedule/metrics, web handoff actions

---

## B) Android — Managed Google Play Private Apps

1. **Prepare studio config**
   - Set env and Android package (`ANDROID_PACKAGE`) for studio variant

2. **Build and publish**
   - Build Android app bundle (AAB) via EAS
   - Publish as private app to Managed Google Play

3. **Restrict distribution**
   - Assign app to approved enterprise/studio organization groups
   - Confirm private visibility and install eligibility

4. **Post-release validation**
   - Install on managed device/profile
   - Validate login and key web handoff flows

---

## C) New Binary vs EAS Update

Use this matrix during release planning.

### Requires **new binary** (EAS Build + re-submit/private publish)

- Native module additions/removals/updates
- Changes to iOS entitlements, permissions, or Android manifest-level capabilities
- App icon, splash, app name, bundle/package identifiers
- Expo SDK/react-native upgrades requiring native rebuild
- Any change requiring fresh platform review or new store artifact

### Eligible for **EAS Update** (no new binary)

- JS/TS logic/UI updates within existing native capabilities
- Text/content tweaks and most styling changes
- Non-native navigation or screen behavior updates
- Safe link handoff updates (e.g., web account URL query params)

> If uncertain, default to a test EAS Update in staging channel first. If update fails due to runtime/native mismatch, rebuild binary.

---

## D) Suggested Release Sequence (Per Studio)

1. Run mobile checks (lint/typecheck/tests)
2. Verify compliance checklist and metadata
3. Decide update type (binary vs OTA)
4. Ship iOS private release path
5. Ship Android private release path
6. Validate on managed devices
7. Record release notes + assignment confirmation

## E) Rollback Notes

- **EAS Update rollback:** republish previous stable update to production channel
- **Binary rollback:** unassign/disable problematic version in enterprise distribution console and redeploy prior approved build where feasible
