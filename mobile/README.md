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

## Local Run

1. Create a variant env file:

```bash
pnpm prepare:studio --slug zenith --name "Zenith Pilates"
cp .env.studio.zenith .env.local
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

Build commands:

```bash
pnpm build:ios:production
pnpm build:android:production
```

## Update Strategy

- JS/UI updates can ship broadly via EAS Update channels.
- Native dependency/config changes require a new binary per app.
