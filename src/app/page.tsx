import LiveHomePage from "@/components/marketing/live-home-page"
import SiteLockScreen from "@/components/marketing/site-lock-screen"
import { getPlatformSettings, hasValidSiteLockAccess } from "@/lib/platform-settings"

export default async function HomePage() {
  const settings = await getPlatformSettings()

  if (settings.siteLockEnabled) {
    const hasAccess = await hasValidSiteLockAccess()
    if (!hasAccess) {
      return <SiteLockScreen />
    }
  }

  return <LiveHomePage />
}
