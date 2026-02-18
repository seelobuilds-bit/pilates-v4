import { useMemo, useState } from "react"
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileConfig } from "@/src/lib/config"

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const studioLabel = useMemo(() => {
    if (mobileConfig.studioName && mobileConfig.studioSubdomain) {
      return `${mobileConfig.studioName} (${mobileConfig.studioSubdomain})`
    }
    return mobileConfig.studioName
  }, [])

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed"
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to {studioLabel}</Text>
        <Text style={styles.subtitle}>Sign in as studio owner, teacher, or client.</Text>

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable onPress={handleLogin} disabled={submitting} style={[styles.button, submitting && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    marginBottom: 8,
    color: "#334155",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "white",
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: mobileConfig.primaryColor,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
  },
  error: {
    color: "#dc2626",
    marginTop: 2,
  },
})
