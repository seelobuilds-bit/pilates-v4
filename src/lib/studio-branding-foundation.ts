type ExistingStudioBrandSource = {
  id: string
  name: string
  subdomain: string
  primaryColor: string | null
  logoUrl: string | null
  logoScale: number | null
  stripeCurrency: string | null
  typographyConfig?: {
    displayFontKey: string | null
    bodyFontKey: string | null
    displayFontFamily: string | null
    bodyFontFamily: string | null
    displayFontSourceUrl: string | null
    bodyFontSourceUrl: string | null
  } | null
  appConfig?: {
    appDisplayName: string | null
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
  } | null
  brandingConfig?: {
    primaryColor: string | null
    primaryColorStrong: string | null
    accentSoft: string | null
    canvasColor: string | null
    surfaceColor: string | null
    subtleColor: string | null
    textPrimary: string | null
    textMuted: string | null
    logoUrl: string | null
    logoInverseUrl: string | null
    logoScale: number | null
  } | null
}

export type StudioBrandingFoundation = {
  branding: {
    primaryColor: string
    primaryColorStrong: string
    accentSoft: string
    canvasColor: string
    surfaceColor: string
    subtleColor: string
    textPrimary: string
    textMuted: string
    logoUrl: string | null
    logoInverseUrl: string | null
    logoScale: number
  }
  typography: {
    displayFontKey: string
    bodyFontKey: string
    displayFontFamily: string
    bodyFontFamily: string
    displayFontSourceUrl: string | null
    bodyFontSourceUrl: string | null
  }
  app: {
    appDisplayName: string
    supportEmail: string | null
    supportUrl: string | null
    privacyPolicyUrl: string | null
    termsUrl: string | null
    appStoreSubtitle: string | null
    iconUrl: string | null
    splashImageUrl: string | null
    splashBackgroundColor: string
    iosBundleIdentifier: string
    androidPackageName: string
    expoProjectId: string | null
  }
}

export const CURRENT_DEFAULT_BRANDING = {
  primaryColor: "#e3120b",
  primaryColorStrong: "#b10e08",
  accentSoft: "#f2e5e5",
  canvasColor: "#f9f9f9",
  surfaceColor: "#ffffff",
  subtleColor: "#f2f2f2",
  textPrimary: "#0d0d0d",
  textMuted: "#706f6e",
} as const

export const CURRENT_DEFAULT_TYPOGRAPHY = {
  displayFontKey: "instrument-serif",
  bodyFontKey: "dm-sans",
  displayFontFamily: "Instrument Serif",
  bodyFontFamily: "DM Sans",
  displayFontSourceUrl: null,
  bodyFontSourceUrl: null,
} as const

function compactPackageSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

export function buildStudioBrandingFoundation(studio: ExistingStudioBrandSource): StudioBrandingFoundation {
  const primaryColor =
    studio.brandingConfig?.primaryColor ||
    studio.primaryColor ||
    CURRENT_DEFAULT_BRANDING.primaryColor
  const logoUrl = studio.brandingConfig?.logoUrl || studio.logoUrl
  const logoScale = studio.brandingConfig?.logoScale ?? studio.logoScale ?? 100
  const packageSegment = compactPackageSegment(studio.subdomain) || "studio"

  return {
    branding: {
      primaryColor,
      primaryColorStrong:
        studio.brandingConfig?.primaryColorStrong || CURRENT_DEFAULT_BRANDING.primaryColorStrong,
      accentSoft: studio.brandingConfig?.accentSoft || CURRENT_DEFAULT_BRANDING.accentSoft,
      canvasColor: studio.brandingConfig?.canvasColor || CURRENT_DEFAULT_BRANDING.canvasColor,
      surfaceColor: studio.brandingConfig?.surfaceColor || CURRENT_DEFAULT_BRANDING.surfaceColor,
      subtleColor: studio.brandingConfig?.subtleColor || CURRENT_DEFAULT_BRANDING.subtleColor,
      textPrimary: studio.brandingConfig?.textPrimary || CURRENT_DEFAULT_BRANDING.textPrimary,
      textMuted: studio.brandingConfig?.textMuted || CURRENT_DEFAULT_BRANDING.textMuted,
      logoUrl,
      logoInverseUrl: studio.brandingConfig?.logoInverseUrl || null,
      logoScale,
    },
    typography: {
      displayFontKey: studio.typographyConfig?.displayFontKey || CURRENT_DEFAULT_TYPOGRAPHY.displayFontKey,
      bodyFontKey: studio.typographyConfig?.bodyFontKey || CURRENT_DEFAULT_TYPOGRAPHY.bodyFontKey,
      displayFontFamily:
        studio.typographyConfig?.displayFontFamily || CURRENT_DEFAULT_TYPOGRAPHY.displayFontFamily,
      bodyFontFamily: studio.typographyConfig?.bodyFontFamily || CURRENT_DEFAULT_TYPOGRAPHY.bodyFontFamily,
      displayFontSourceUrl:
        studio.typographyConfig?.displayFontSourceUrl || CURRENT_DEFAULT_TYPOGRAPHY.displayFontSourceUrl,
      bodyFontSourceUrl:
        studio.typographyConfig?.bodyFontSourceUrl || CURRENT_DEFAULT_TYPOGRAPHY.bodyFontSourceUrl,
    },
    app: {
      appDisplayName: studio.appConfig?.appDisplayName || studio.name,
      supportEmail: studio.appConfig?.supportEmail || null,
      supportUrl: studio.appConfig?.supportUrl || null,
      privacyPolicyUrl: studio.appConfig?.privacyPolicyUrl || null,
      termsUrl: studio.appConfig?.termsUrl || null,
      appStoreSubtitle: studio.appConfig?.appStoreSubtitle || null,
      iconUrl: studio.appConfig?.iconUrl || logoUrl,
      splashImageUrl: studio.appConfig?.splashImageUrl || logoUrl,
      splashBackgroundColor:
        studio.appConfig?.splashBackgroundColor || CURRENT_DEFAULT_BRANDING.canvasColor,
      iosBundleIdentifier:
        studio.appConfig?.iosBundleIdentifier || `app.current.studio.${packageSegment}`,
      androidPackageName:
        studio.appConfig?.androidPackageName || `app.current.studio.${packageSegment}`,
      expoProjectId: studio.appConfig?.expoProjectId || null,
    },
  }
}
