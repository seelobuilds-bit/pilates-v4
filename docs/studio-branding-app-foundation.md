# Studio Branding And App Foundation

## What "branding" means here

Branding is not the screen layout itself.

Branding is the shared tenant-level design and packaging configuration that every surface reads from:

- web app
- booking flow
- booking embed
- mobile web
- React Android app
- Swift iOS app

This layer controls things like:

- accent color
- surface/background colors
- logo
- logo scale
- display font
- body/UI font
- app display name
- app icon / splash assets
- package identifiers and release metadata
- feature flags / enabled modules

The actual app design still happens screen-by-screen.
This foundation just ensures every surface reads the same studio configuration instead of each platform inventing its own version.

## Current gap

Today the product has three separate partial systems:

1. Web/studio settings
- `Studio.primaryColor`
- `Studio.logoUrl`
- `Studio.logoScale`

2. Booking/embed font settings
- partially browser/local-storage driven
- not canonical

3. Mobile runtime/build config
- mostly `primaryColor`
- some build-time app metadata in Expo env files

That is not sufficient for:

- branded iOS apps
- branded Android apps
- repeatable onboarding
- one-click rollout of color/font updates

## Target architecture

There should be one canonical source of truth per studio.

### 1. Studio branding

Runtime design tokens used by every platform.

Suggested shape:

```ts
type StudioBrandingConfig = {
  primaryColor: string
  primaryColorStrong: string | null
  accentSoft: string | null
  backgroundCanvas: string | null
  backgroundSurface: string | null
  backgroundSubtle: string | null
  textPrimary: string | null
  textMuted: string | null
  logoUrl: string | null
  logoInverseUrl: string | null
  logoScale: number
}
```

Minimum rule:

- if a studio changes their accent color, that color must propagate to:
  - web app
  - booking flow
  - booking embed
  - mobile web
  - React Android
  - Swift iOS

### 2. Studio typography

Font configuration shared across every surface.

Suggested shape:

```ts
type StudioTypographyConfig = {
  displayFontKey: string
  bodyFontKey: string
  displayFontFamily: string | null
  bodyFontFamily: string | null
  displayFontSourceUrl: string | null
  bodyFontSourceUrl: string | null
}
```

Rules:

- default display font = Current display font
- default body font = Current body font
- studios can override one or both
- font choice should be stored server-side, not in local storage
- booking flows must use the same studio typography source of truth

Practical default for Current:

- display: `Instrument Serif`
- body/UI: `DM Sans`

### 3. Studio app config

Build/runtime metadata for white-label apps.

Suggested shape:

```ts
type StudioAppConfig = {
  appDisplayName: string
  supportEmail: string | null
  supportUrl: string | null
  privacyPolicyUrl: string | null
  termsUrl: string | null
  appStoreSubtitle: string | null
  iconUrl: string | null
  splashImageUrl: string | null
  splashBackgroundColor: string | null
  iosBundleIdentifier: string | null
  androidPackageName: string | null
  expoProjectId: string | null
}
```

This is not the screen design.
This is the app identity/package layer needed to ship branded apps cleanly.

### 4. Studio feature config

Platform-visible flags/config that affect what the app shows.

Suggested shape:

```ts
type StudioFeatureConfig = {
  invoicesEnabled: boolean
  employeesEnabled: boolean
  timeOffEnabled: boolean
  vaultEnabled: boolean
  storeEnabled: boolean
  leaderboardsEnabled: boolean
  marketingEnabled: boolean
}
```

Some of these already exist in `Studio`.
The important part is exposing them through the same shared config surface consumed by every client.

## Recommended data model

Use additive one-to-one config tables rather than overloading `Studio` forever.

### StudioBrandingConfig

- `id`
- `studioId` unique
- `primaryColor`
- `primaryColorStrong`
- `accentSoft`
- `backgroundCanvas`
- `backgroundSurface`
- `backgroundSubtle`
- `textPrimary`
- `textMuted`
- `logoUrl`
- `logoInverseUrl`
- `logoScale`
- `createdAt`
- `updatedAt`

### StudioTypographyConfig

- `id`
- `studioId` unique
- `displayFontKey`
- `bodyFontKey`
- `displayFontFamily`
- `bodyFontFamily`
- `displayFontSourceUrl`
- `bodyFontSourceUrl`
- `createdAt`
- `updatedAt`

### StudioAppConfig

- `id`
- `studioId` unique
- `appDisplayName`
- `supportEmail`
- `supportUrl`
- `privacyPolicyUrl`
- `termsUrl`
- `appStoreSubtitle`
- `iconUrl`
- `splashImageUrl`
- `splashBackgroundColor`
- `iosBundleIdentifier`
- `androidPackageName`
- `expoProjectId`
- `createdAt`
- `updatedAt`

This keeps concerns separated:

- studio operational data stays on `Studio`
- branding/typography/app identity are first-class config models

## Shared read model

All clients should consume one normalized server payload.

Suggested payload:

```ts
type StudioAppBootstrap = {
  studio: {
    id: string
    name: string
    subdomain: string
    currency: string | null
  }
  branding: StudioBrandingConfig
  typography: StudioTypographyConfig
  app: StudioAppConfig
  features: StudioFeatureConfig
}
```

That payload should become the single source of truth for:

- web dashboard shell
- booking shell
- embed shell
- mobile bootstrap
- future Swift bootstrap

## How each platform should use it

### Web

- reads branding + typography server-side in layout
- converts them into CSS variables
- uses the same font config for:
  - app UI
  - booking flow
  - embed

### React Android

- stop relying on only `EXPO_PUBLIC_BRAND_PRIMARY`
- bootstrap from server after auth / subdomain resolution
- use app config for runtime branding
- keep only true build-time package data in env/build config

### Swift iOS

- read the same bootstrap payload
- map:
  - branding -> SwiftUI color tokens
  - typography -> app typography system
  - app config -> naming/support/settings surfaces
- do not hardcode tenant styling in the app target

## Build-time vs runtime

This split is critical.

### Runtime config

Comes from backend per studio.

Examples:

- primary color
- fonts
- logo
- support links
- feature flags

### Build-time config

Needed for store packaging.

Examples:

- bundle identifier
- package name
- app icon
- splash assets
- store listing metadata

Runtime config is shared across all clients.
Build-time config is what allows one shared codebase to produce many branded apps.

## Onboarding target state

When HQ creates a new studio, onboarding should eventually capture:

### Required

- studio name
- subdomain
- owner details
- default currency
- country
- primary color
- logo

### Branding

- display font
- body font
- optional custom font uploads
- icon
- splash image

### App identity

- iOS bundle id
- Android package name
- app display name
- support email
- privacy policy URL
- terms URL

### Operational flags

- invoices enabled
- employees enabled
- time off enabled
- vault enabled
- store enabled

## Default behavior

If a studio has not customized branding:

- colors fall back to Current defaults
- display font falls back to Current display font
- body font falls back to Current body font
- app display name falls back to studio name

That means onboarding stays simple, but customization is available immediately.

## Why this comes before Swift polish

This foundation should come before heavy React/Swift polish because otherwise:

- React Android will invent one branding model
- Swift iOS will invent another
- onboarding will become manual and inconsistent
- future feature rollout will drift

The correct sequence is:

1. define canonical branding/app config
2. expose one shared bootstrap payload
3. wire web to it fully
4. wire React Android to it fully
5. build Swift iOS on the same foundation

## Immediate implementation order

1. Add config models to Prisma
2. Add shared server read model
3. Extend studio settings API to read/write branding + typography + app config
4. Move booking font setting from local-only behavior to server-backed config
5. Update mobile branding endpoint to return full bootstrap config
6. Add HQ onboarding fields for branding/app metadata

## Non-goals for the first pass

- building final Swift screen layouts
- redesigning the app UX
- per-studio custom code forks

This foundation is about shared configuration and rollout safety, not redesigning the product itself.
