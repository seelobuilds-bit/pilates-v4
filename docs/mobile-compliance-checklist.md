# Mobile Compliance Checklist (Private Distribution)

Use this checklist as the source-of-truth for app-store metadata, privacy answers, and per-studio legal/branding details when shipping private iOS/Android apps from `mobile/`.

## 1) Required Public URLs (Per Studio)

These must be finalized before submitting or assigning a private app.

- **Privacy Policy URL**
  - Format: `https://www.thecurrent.app/<studio-subdomain>/privacy` (or studio-owned equivalent)
  - Must describe data collected by the mobile app and linked web account flows.
- **Terms URL**
  - Format: `https://www.thecurrent.app/<studio-subdomain>/terms` (or studio-owned equivalent)
- **Support URL / Contact**
  - Support page URL: `https://www.thecurrent.app/<studio-subdomain>/support` (if available)
  - Support email: `support@<studio-domain>` or designated studio support inbox

> Keep links HTTPS and publicly accessible without login where possible.

## 2) Data Safety / Privacy Source-of-Truth

When filling App Store Connect privacy nutrition labels and Google Play Data safety forms, use these primary references:

- `mobile/src/lib/api.ts` and `mobile/src/context/auth-context.tsx` for auth/session data flows
- `mobile/src/types/mobile.ts` for user/bootstrap payload structure
- Backend endpoints used by mobile (documented in `docs/mobile-private-apps.md`)
- Any analytics, crash reporting, or third-party SDK configuration in `mobile/` (if added in future)

### Data Safety Review Prompts

For each release, confirm and record:

- What user data types are collected (email, name, studio association, usage metadata, etc.)
- Whether data is shared with third parties (and for what purpose)
- Whether data is encrypted in transit
- Whether users can request account deletion (handoff via web account settings)
- Whether data collection is mandatory for core app functionality

## 3) App Review Notes Template (iOS + Android Private)

Copy/paste and customize per studio submission.

### iOS (Apple Business Manager Custom App) — Review Notes

- **Distribution model:** Private custom app distributed via Apple Business Manager to authorized organization(s) only.
- **Who can access:** Members/employees/clients of `<Studio Name>`.
- **Login requirement:** Users must authenticate with valid studio account credentials.
- **Primary use case:** View schedule/metrics and open web booking/account flows tied to the studio.
- **Account deletion path:** In-app non-destructive handoff via **Profile → Account deletion request**, which opens the web account settings/deletion flow.
- **Support contact:** `<support-email>`
- **Test account (if requested by reviewer):** `<review-test-account-email/password process>`

### Android (Managed Google Play Private App) — Review Notes

- **Distribution model:** Private app published to Managed Google Play and restricted to approved enterprise/studio org.
- **Who can access:** Authorized users for `<Studio Name>`.
- **Login requirement:** Studio account credentials required.
- **Primary use case:** Studio operations + member account/booking handoff to web.
- **Account deletion path:** In-app non-destructive handoff via **Profile → Account deletion request** to web account settings.
- **Support contact:** `<support-email>`
- **Tester access instructions:** `<if needed>`

## 4) Per-Studio Branding + Legal Metadata Checklist

Complete this before each studio rollout:

- **Studio identity**
  - `EXPO_PUBLIC_STUDIO_NAME`
  - `EXPO_PUBLIC_STUDIO_SUBDOMAIN`
- **Branding**
  - App name (display)
  - App icon / splash assets
  - `EXPO_PUBLIC_BRAND_PRIMARY`
- **Package identifiers**
  - iOS bundle ID (`IOS_BUNDLE_IDENTIFIER`)
  - Android applicationId/package (`ANDROID_PACKAGE`)
- **Legal/public metadata**
  - Privacy Policy URL
  - Terms URL
  - Support URL/email
  - Any age rating/content declarations required by platform
- **Distribution targeting**
  - Apple Business Manager org assignment(s)
  - Managed Google Play organization/group assignment(s)

## 5) Release Gate (Compliance Sign-off)

Before release, confirm:

- [ ] URLs are valid and studio-specific
- [ ] Privacy/data safety answers updated from current code paths
- [ ] App review notes prepared and attached
- [ ] In-app account deletion handoff verified on device
- [ ] Distribution assignments configured (ABM + Managed Google Play)
