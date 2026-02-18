# Current Mobile (Private Studio Apps)

This Expo app is the shared mobile codebase used to produce private white-label iOS and Android apps for each studio.

## Roles

The app supports login for:
- Studio owner
- Teacher
- Client

Auth is handled via:
- `POST /api/mobile/auth/login`
- `GET /api/mobile/auth/me`
- `GET /api/mobile/bootstrap`
- `POST /api/mobile/push/register`
- `POST /api/mobile/push/unregister`

## Local Run

1. Create a variant env file (and release checklist):

```bash
pnpm prepare:studio --slug zenith --name "Zenith Pilates"
cp .env.studio.zenith .env.local
```

This generates:
- `.env.studio.zenith`
- `releases/zenith/release-checklist.md`

Use `--dry-run` to preview outputs without writing files:

```bash
pnpm prepare:studio --slug zenith --name "Zenith Pilates" --dry-run
```

2. Start app:

```bash
pnpm start
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
