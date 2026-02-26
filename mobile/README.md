# Current Mobile (Private Studio Apps)

This Expo app is the shared mobile codebase used to produce private white-label iOS and Android apps for each studio.

## Roles

The app supports login for:
- Studio owner
- Teacher
- Client

Studio owner can update mobile brand accent color directly in the Profile screen.
That updates `studio.primaryColor` and the app applies it at runtime across screens.

Auth is handled via:
- `POST /api/mobile/auth/login`
- `GET /api/mobile/auth/me`
- `GET /api/mobile/bootstrap`
- `POST /api/mobile/push/register`
- `POST /api/mobile/push/unregister`
- `POST /api/mobile/push/test`
- `GET /api/mobile/push/status`

## Local Run

1. Create a variant env file (and release checklist):

```bash
pnpm prepare:studio --slug zenith --name "Zenith Pilates"
cp .env.studio.zenith .env.local
```

This generates:
- `.env.studio.zenith`
- `releases/zenith/release-checklist.md`

Optional for Expo/testing builds only:
- set `EXPO_PUBLIC_ALLOW_SUBDOMAIN_OVERRIDE=1` to show editable studio subdomain on login.
- keep it `0` for production white-label binaries.

Use `--dry-run` to preview outputs without writing files:

```bash
pnpm prepare:studio --slug zenith --name "Zenith Pilates" --dry-run
```

2. Start app:

```bash
pnpm start
```

## Mobile Smoke Check (API)

From repo root:

```bash
TEST_BASE_URL=https://your-preview-or-staging-url \
TEST_MOBILE_STUDIO_SUBDOMAIN=your-studio \
TEST_MOBILE_OWNER_EMAIL=owner@example.com \
TEST_MOBILE_OWNER_PASSWORD='***' \
pnpm test:smoke:mobile
```

If you want the smoke run to fail hard when env/base URL is missing or unreachable, set:

```bash
TEST_REQUIRE_MOBILE_SMOKE=1
```

Pure push-route mapping smoke (no API/env needed):

```bash
pnpm test:smoke:mobile:routing
```

Pure auth-route mapping smoke (no API/env needed):

```bash
pnpm test:smoke:mobile:auth-routing
```

## Per-Studio Build

Each studio has unique:
- app name (`EXPO_PUBLIC_STUDIO_NAME`)
- subdomain (`EXPO_PUBLIC_STUDIO_SUBDOMAIN`)
- iOS bundle ID (`IOS_BUNDLE_IDENTIFIER`)
- Android package (`ANDROID_PACKAGE`)
- EAS project id for push token registration (`EXPO_PROJECT_ID`)

Build commands:

```bash
pnpm build:ios:production
pnpm build:android:production
```

## Update Strategy

- JS/UI updates can ship broadly via EAS Update channels.
- Native dependency/config changes require a new binary per app.

## Push Delivery

- Backend can use optional `EXPO_PUSH_ACCESS_TOKEN` for authenticated push delivery.
- Profile tab includes **Send test notification** to verify token registration on a real device.
- Profile tab includes per-device push toggle (pause/resume without signing out).
- Notification tap routing is wired:
  - inbox messages -> Inbox tab
  - booking updates -> Schedule tab
  - test push -> Profile tab
