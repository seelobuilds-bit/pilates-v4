import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
import { getStudioPrimaryColor, mobileTheme, setStudioRuntimePrimaryColor, withOpacity } from "@/src/lib/theme"
import type { MobilePushCategory } from "@/src/types/mobile"

const PUSH_CATEGORY_OPTIONS: {
  key: MobilePushCategory
  label: string
  description: string
}[] = [
  { key: "INBOX", label: "Inbox", description: "New inbound and outbound message alerts" },
  { key: "BOOKINGS", label: "Bookings", description: "New, reactivated, and cancelled class bookings" },
  { key: "SYSTEM", label: "System", description: "Operational updates and push tests" },
]

const BRAND_SWATCHES = ["#2563eb", "#0ea5e9", "#16a34a", "#7c3aed", "#e11d48", "#f97316", "#0f766e", "#111827"]

function normalizeHexColor(value: string) {
  const candidate = value.trim().toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(candidate)) {
    return null
  }
  return candidate
}

export default function ProfileScreen() {
  const {
    user,
    bootstrap,
    token,
    pushEnabled,
    pushCategories,
    updatePushEnabled,
    updatePushCategoryPreference,
    refreshBootstrap,
    signOut,
  } = useAuth()
  const primaryColor = getStudioPrimaryColor()
  const [openingDeletionRequest, setOpeningDeletionRequest] = useState(false)
  const [sendingTestPush, setSendingTestPush] = useState(false)
  const [updatingPushPreference, setUpdatingPushPreference] = useState(false)
  const [updatingPushCategory, setUpdatingPushCategory] = useState<MobilePushCategory | null>(null)
  const [pushStatusLoading, setPushStatusLoading] = useState(false)
  const [brandColorInput, setBrandColorInput] = useState(primaryColor)
  const [updatingBrandColor, setUpdatingBrandColor] = useState(false)
  const [pushStatus, setPushStatus] = useState<{
    totalCount: number
    enabledCount: number
    disabledCount: number
    latestSeenAt: string | null
    notificationCategories: MobilePushCategory[]
  } | null>(null)

  const subdomain = useMemo(
    () => (bootstrap?.studio?.subdomain || user?.studio?.subdomain || mobileConfig.studioSubdomain || "").trim().toLowerCase(),
    [bootstrap?.studio?.subdomain, user?.studio?.subdomain]
  )

  const accountDeletionUrl = useMemo(() => {
    if (!subdomain) return null
    const base = mobileConfig.apiBaseUrl.replace(/\/$/, "")
    return `${base}/${subdomain}/account?source=mobile&intent=deletion-request`
  }, [subdomain])

  const loadPushStatus = useCallback(async () => {
    if (!token) {
      setPushStatus(null)
      return
    }

    setPushStatusLoading(true)
    try {
      const response = await mobileApi.pushStatus(token)
      setPushStatus(response.push)
    } catch {
      setPushStatus(null)
    } finally {
      setPushStatusLoading(false)
    }
  }, [token])

  useEffect(() => {
    void loadPushStatus()
  }, [loadPushStatus])

  const handleAccountDeletionRequest = async () => {
    if (!accountDeletionUrl) {
      Alert.alert("Studio missing", "Studio subdomain is required to open account deletion settings.")
      return
    }

    setOpeningDeletionRequest(true)
    try {
      await Linking.openURL(accountDeletionUrl)
    } catch {
      Alert.alert("Could not open link", "Please try again in a moment.")
    } finally {
      setOpeningDeletionRequest(false)
    }
  }

  const handleTestPush = async () => {
    if (!token) {
      Alert.alert("Session expired", "Please sign in again to run a push test.")
      return
    }

    setSendingTestPush(true)
    try {
      const result = await mobileApi.sendPushTest(token)
      if (result.sent > 0) {
        Alert.alert("Push sent", `Delivered ${result.sent} test notification(s).`)
      } else {
        Alert.alert(
          "No active push device",
          "No enabled push token was found for this account on this studio. Re-open the app on a physical device and allow notifications."
        )
      }
      await loadPushStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to send push test"
      Alert.alert("Push test failed", message)
    } finally {
      setSendingTestPush(false)
    }
  }

  const handleTogglePushPreference = async () => {
    setUpdatingPushPreference(true)
    try {
      await updatePushEnabled(!pushEnabled)
      await loadPushStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update push setting"
      Alert.alert("Push setting failed", message)
    } finally {
      setUpdatingPushPreference(false)
    }
  }

  const handleTogglePushCategory = async (category: MobilePushCategory, next: boolean) => {
    setUpdatingPushCategory(category)
    try {
      await updatePushCategoryPreference(category, next)
      await loadPushStatus()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update notification category"
      Alert.alert("Category update failed", message)
    } finally {
      setUpdatingPushCategory(null)
    }
  }

  const serverCategories = pushStatus?.notificationCategories || []
  const displayName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Unknown User"
  const studioName = bootstrap?.studio?.name || user?.studio?.name || mobileConfig.studioName
  const isOwner = user?.role === "OWNER"
  const storedStudioColor = bootstrap?.studio?.primaryColor || user?.studio?.primaryColor || null

  useEffect(() => {
    const normalized = normalizeHexColor(storedStudioColor || "")
    if (normalized) {
      setBrandColorInput(normalized)
      return
    }
    setBrandColorInput(getStudioPrimaryColor())
  }, [storedStudioColor])

  const handleSaveBrandColor = async () => {
    if (!token) {
      Alert.alert("Session expired", "Please sign in again.")
      return
    }

    const normalized = normalizeHexColor(brandColorInput)
    if (!normalized) {
      Alert.alert("Invalid color", "Use a hex color like #2563eb")
      return
    }

    setUpdatingBrandColor(true)
    try {
      const response = await mobileApi.updateStudioBranding(token, normalized)
      setStudioRuntimePrimaryColor(response.studio.primaryColor || normalized)
      await refreshBootstrap()
      Alert.alert("Saved", "App accent color updated for this studio.")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update studio color"
      Alert.alert("Could not save color", message)
    } finally {
      setUpdatingBrandColor(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.heroCard, { borderColor: withOpacity(primaryColor, 0.28), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.heroText}>{displayName}</Text>
        <Text style={styles.heroMeta}>{studioName} {user?.role ? `- ${user.role}` : ""}</Text>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Text style={styles.row}>Name: {displayName}</Text>
        <Text style={styles.row}>Email: {user?.email || "-"}</Text>
        <Text style={styles.row}>Role: {user?.role || "-"}</Text>
      </View>

      {isOwner ? (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Brand Accent</Text>
          <Text style={styles.row}>Choose a studio accent color for mobile surfaces.</Text>
          <View style={styles.swatchRow}>
            {BRAND_SWATCHES.map((swatch) => {
              const selected = normalizeHexColor(brandColorInput) === swatch
              return (
                <Pressable
                  key={swatch}
                  style={[styles.swatchButton, { backgroundColor: swatch }, selected ? styles.swatchSelected : null]}
                  onPress={() => setBrandColorInput(swatch)}
                />
              )
            })}
          </View>
          <TextInput
            value={brandColorInput}
            onChangeText={setBrandColorInput}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="#2563eb"
            style={styles.colorInput}
          />
          <Pressable
            style={[styles.secondaryButton, { borderColor: primaryColor }, updatingBrandColor && styles.secondaryButtonDisabled]}
            onPress={() => void handleSaveBrandColor()}
            disabled={updatingBrandColor}
          >
            <Text style={[styles.secondaryButtonText, { color: primaryColor }]}>
              {updatingBrandColor ? "Saving color..." : "Save Brand Color"}
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Push Summary</Text>
        <Text style={styles.row}>Device preference: {pushEnabled ? "Enabled" : "Paused"}</Text>
        <Text style={styles.row}>
          Categories: {pushCategories.length > 0 ? pushCategories.join(", ") : "None (all muted)"}
        </Text>
        <Text style={styles.row}>
          Registrations: {pushStatusLoading ? "Checking..." : `${pushStatus?.enabledCount || 0} enabled / ${pushStatus?.totalCount || 0} total`}
        </Text>
        {pushStatus?.latestSeenAt ? <Text style={styles.row}>Last activity: {new Date(pushStatus.latestSeenAt).toLocaleString()}</Text> : null}
        <Text style={styles.row}>
          Server categories: {pushStatusLoading ? "Checking..." : serverCategories.length > 0 ? serverCategories.join(", ") : "None"}
        </Text>
      </View>

      <View style={styles.actionsCard}>
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Notification categories</Text>
          {PUSH_CATEGORY_OPTIONS.map((option) => {
            const isEnabled = pushCategories.includes(option.key)
            const isUpdating = updatingPushCategory === option.key
            return (
              <Pressable
                key={option.key}
                style={[
                  styles.categoryButton,
                  isEnabled
                    ? [styles.categoryButtonEnabled, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]
                    : styles.categoryButtonDisabled,
                  (!pushEnabled || isUpdating) && styles.categoryButtonMuted,
                ]}
                onPress={() => void handleTogglePushCategory(option.key, !isEnabled)}
                disabled={!pushEnabled || isUpdating}
              >
                <Text
                  style={[styles.categoryButtonLabel, isEnabled ? [styles.categoryButtonLabelEnabled, { color: primaryColor }] : styles.categoryButtonLabelDisabled]}
                >
                  {isUpdating ? "Updating..." : `${isEnabled ? "On" : "Off"} - ${option.label}`}
                </Text>
                <Text style={styles.categoryButtonDescription}>{option.description}</Text>
              </Pressable>
            )
          })}
          {!pushEnabled ? <Text style={styles.categoryHint}>Enable device notifications first to update server delivery settings.</Text> : null}
        </View>

        <Pressable
          style={[styles.secondaryButton, openingDeletionRequest && styles.secondaryButtonDisabled]}
          onPress={() => void handleAccountDeletionRequest()}
          disabled={openingDeletionRequest}
        >
          <Text style={styles.secondaryButtonText}>
            {openingDeletionRequest ? "Opening..." : "Account deletion request"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, sendingTestPush && styles.secondaryButtonDisabled]}
          onPress={() => void handleTestPush()}
          disabled={sendingTestPush}
        >
          <Text style={styles.secondaryButtonText}>
            {sendingTestPush ? "Sending test..." : "Send test notification"}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.secondaryButton, updatingPushPreference && styles.secondaryButtonDisabled]}
          onPress={() => void handleTogglePushPreference()}
          disabled={updatingPushPreference}
        >
          <Text style={styles.secondaryButtonText}>
            {updatingPushPreference
              ? "Updating push setting..."
              : pushEnabled
                ? "Pause notifications on this device"
                : "Enable notifications on this device"}
          </Text>
        </Pressable>

        <Pressable style={[styles.button, { backgroundColor: primaryColor }]} onPress={() => void signOut()}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
    backgroundColor: mobileTheme.colors.canvas,
    paddingBottom: 48,
  },
  heroCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  title: { fontSize: 24, fontWeight: "700", color: mobileTheme.colors.text },
  heroText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 16,
  },
  heroMeta: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 4,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  row: { color: mobileTheme.colors.textMuted },
  actionsCard: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  categorySection: {
    gap: 6,
    marginBottom: 4,
  },
  categoryButton: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 3,
  },
  categoryButtonEnabled: {
    backgroundColor: "#eff6ff",
    borderColor: mobileTheme.colors.borderMuted,
  },
  categoryButtonDisabled: {
    backgroundColor: mobileTheme.colors.surface,
    borderColor: mobileTheme.colors.borderMuted,
  },
  categoryButtonMuted: {
    opacity: 0.6,
  },
  categoryButtonLabel: {
    fontWeight: "700",
  },
  categoryButtonLabelEnabled: {
    color: mobileTheme.colors.text,
  },
  categoryButtonLabelDisabled: {
    color: mobileTheme.colors.textMuted,
  },
  categoryButtonDescription: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  categoryHint: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.text,
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    alignItems: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  swatchRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  swatchButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
  },
  swatchSelected: {
    borderWidth: 2,
    borderColor: mobileTheme.colors.text,
  },
  colorInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: mobileTheme.colors.text,
    backgroundColor: mobileTheme.colors.surface,
  },
})
