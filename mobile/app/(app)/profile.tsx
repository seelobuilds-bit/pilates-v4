import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo, useState } from "react"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { mobileConfig } from "@/src/lib/config"

export default function ProfileScreen() {
  const { user, bootstrap, token, pushEnabled, updatePushEnabled, signOut } = useAuth()
  const [openingDeletionRequest, setOpeningDeletionRequest] = useState(false)
  const [sendingTestPush, setSendingTestPush] = useState(false)
  const [updatingPushPreference, setUpdatingPushPreference] = useState(false)

  const subdomain = useMemo(
    () => (bootstrap?.studio?.subdomain || user?.studio?.subdomain || mobileConfig.studioSubdomain || "").trim().toLowerCase(),
    [bootstrap?.studio?.subdomain, user?.studio?.subdomain]
  )

  const accountDeletionUrl = useMemo(() => {
    if (!subdomain) return null
    const base = mobileConfig.apiBaseUrl.replace(/\/$/, "")
    return `${base}/${subdomain}/account?source=mobile&intent=deletion-request`
  }, [subdomain])

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update push setting"
      Alert.alert("Push setting failed", message)
    } finally {
      setUpdatingPushPreference(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.row}>Name: {user?.firstName} {user?.lastName}</Text>
      <Text style={styles.row}>Email: {user?.email}</Text>
      <Text style={styles.row}>Role: {user?.role}</Text>

      <View style={styles.actions}>
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
