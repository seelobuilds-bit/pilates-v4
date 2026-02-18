import type { ExpoConfig } from "expo/config"

function sanitizeSegment(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized || fallback
}

const studioSubdomain = sanitizeSegment(process.env.EXPO_PUBLIC_STUDIO_SUBDOMAIN || "template", "template")
const studioName = process.env.EXPO_PUBLIC_STUDIO_NAME || "Current Studio"
const primaryColor = process.env.EXPO_PUBLIC_BRAND_PRIMARY || "#2563eb"
const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.thecurrent.app"

const iosBundleIdentifier =
  process.env.IOS_BUNDLE_IDENTIFIER || `app.current.studio.${studioSubdomain.replace(/-/g, "")}`
const androidPackage =
  process.env.ANDROID_PACKAGE || `app.current.studio.${studioSubdomain.replace(/-/g, "")}`

const config: ExpoConfig = {
  name: studioName,
  slug: `current-${studioSubdomain}`,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: `current-${studioSubdomain}`,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: iosBundleIdentifier,
  },
  android: {
    package: androidPackage,
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    studioSubdomain,
    studioName,
    primaryColor,
    apiBaseUrl,
    eas: {
      projectId: process.env.EXPO_PROJECT_ID || "",
    },
  },
}

export default config
