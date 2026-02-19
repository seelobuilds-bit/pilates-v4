# Mobile Private App Rollout

## Goal

Ship one shared mobile codebase while distributing private branded apps per studio for iOS and Android.

## Architecture

- Shared codebase: `mobile/` (Expo + Expo Router)
- Shared backend: existing Next.js APIs + new mobile auth endpoints
- Per-studio app identity via env:
  - `EXPO_PUBLIC_STUDIO_NAME`
  - `EXPO_PUBLIC_STUDIO_SUBDOMAIN`
  - `IOS_BUNDLE_IDENTIFIER`
  - `ANDROID_PACKAGE`

## Backend Endpoints (mobile)

- `POST /api/mobile/auth/login`
- `GET /api/mobile/auth/me`
- `POST /api/mobile/auth/logout`
- `GET /api/mobile/bootstrap`
- `POST /api/mobile/push/register`
- `POST /api/mobile/push/unregister`
- `POST /api/mobile/push/test`
- `GET /api/mobile/push/status`

Push registration supports per-device category filtering (`INBOX`, `BOOKINGS`, `SYSTEM`) via `notificationCategories`.

## Studio Onboarding Flow

1. Generate env template:
   - `pnpm --dir mobile prepare:studio --slug <studio-subdomain> --name "<Studio Name>"`
2. Set mobile env (`mobile/.env.local`) from generated file.
3. Build iOS + Android binaries via EAS.
4. Distribute as private apps:
   - iOS: Apple Custom Apps (Apple Business Manager)
   - Android: Managed Google Play private apps

## Release Model

- Feature/UI updates: EAS Update channels (`preview`, `production`)
- Native changes: rebuild/resubmit binaries for each studio app

## Compliance Notes

- Keep apps private-distribution to avoid public-store repetitive-content rejection.
- Maintain branded assets, legal text, and privacy policy per studio app metadata.
