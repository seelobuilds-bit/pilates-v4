import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"
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

export default function ProfileScreen() {
  const {
    user,
    bootstrap,
    token,
    pushEnabled,
    pushCategories,
    updatePushEnabled,
    updatePushCategoryPreference,
    signOut,
  } = useAuth()
  const [openingDeletionRequest, setOpeningDeletionRequest] = useState(false)
  const [sendingTestPush, setSendingTestPush] = useState(false)
  const [updatingPushPreference, setUpdatingPushPreference] = useState(false)
  const [updatingPushCategory, setUpdatingPushCategory] = useState<MobilePushCategory | null>(null)
  const [pushStatusLoading, setPushStatusLoading] = useState(false)
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.row}>Name: {user?.firstName} {user?.lastName}</Text>
      <Text style={styles.row}>Email: {user?.email}</Text>
      <Text style={styles.row}>Role: {user?.role}</Text>
      <Text style={styles.row}>Push preference: {pushEnabled ? "Enabled" : "Paused"}</Text>
      <Text style={styles.row}>
        Push categories: {pushCategories.length > 0 ? pushCategories.join(", ") : "None (all muted)"}
      </Text>
      <Text style={styles.row}>
        Push registrations: {pushStatusLoading ? "Checking..." : `${pushStatus?.enabledCount || 0} enabled / ${pushStatus?.totalCount || 0} total`}
      </Text>
      {pushStatus?.latestSeenAt ? <Text style={styles.row}>Last push activity: {new Date(pushStatus.latestSeenAt).toLocaleString()}</Text> : null}
      <Text style={styles.row}>
        Server categories: {pushStatusLoading ? "Checking..." : serverCategories.length > 0 ? serverCategories.join(", ") : "None"}
      </Text>

      <View style={styles.actions}>
        <View style={styles.categorySection}>
          <Text style={styles.categoryTitle}>Notification categories</Text>
          {PUSH_CATEGORY_OPTIONS.map((option) => {
            const isEnabled = pushCategories.includes(option.key)
            const isUpdating = updatingPushCategory === option.key
            return (
              <Pressable
                key={option.key}
                style={[
                  styles.categoryButton,
                  isEnabled ? styles.categoryButtonEnabled : styles.categoryButtonDisabled,
                  (!pushEnabled || isUpdating) && styles.categoryButtonMuted,
                ]}
                onPress={() => void handleTogglePushCategory(option.key, !isEnabled)}
                disabled={!pushEnabled || isUpdating}
              >
                <Text style={[styles.categoryButtonLabel, isEnabled ? styles.categoryButtonLabelEnabled : styles.categoryButtonLabelDisabled]}>
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

        <Pressable style={styles.button} onPress={() => void signOut()}>
          <Text style={styles.buttonText}>Sign out</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  row: { color: "#334155" },
  actions: {
    marginTop: 8,
    gap: 8,
  },
  categorySection: {
    gap: 6,
    marginBottom: 4,
  },
  categoryTitle: {
    color: "#0f172a",
    fontWeight: "700",
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
    borderColor: "#93c5fd",
  },
  categoryButtonDisabled: {
    backgroundColor: "#f8fafc",
    borderColor: "#cbd5e1",
  },
  categoryButtonMuted: {
    opacity: 0.6,
  },
  categoryButtonLabel: {
    fontWeight: "700",
  },
  categoryButtonLabelEnabled: {
    color: "#1d4ed8",
  },
  categoryButtonLabelDisabled: {
    color: "#334155",
  },
  categoryButtonDescription: {
    color: "#64748b",
    fontSize: 12,
  },
  categoryHint: {
    color: "#64748b",
    fontSize: 12,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
  secondaryButton: {
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  secondaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: "#0f172a",
    fontWeight: "700",
  },
})
