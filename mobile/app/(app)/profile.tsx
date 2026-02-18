import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native"
import { useMemo, useState } from "react"
import { useAuth } from "@/src/context/auth-context"
import { mobileConfig } from "@/src/lib/config"

export default function ProfileScreen() {
  const { user, bootstrap, signOut } = useAuth()
  const [openingDeletionRequest, setOpeningDeletionRequest] = useState(false)

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
