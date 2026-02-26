import { useMemo, useState } from "react"
import { Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { mobileConfig } from "@/src/lib/config"
import { mobileTheme, withOpacity } from "@/src/lib/theme"

export default function LoginScreen() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [studioSubdomain, setStudioSubdomain] = useState(mobileConfig.studioSubdomain)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canSubmit = email.trim().length > 0 && password.length > 0 && studioSubdomain.trim().length > 0 && !submitting
  const showSubdomainInput = mobileConfig.allowSubdomainOverride || !mobileConfig.studioSubdomain

  const studioLabel = useMemo(() => {
    if (mobileConfig.studioName && studioSubdomain) {
      return `${mobileConfig.studioName} (${studioSubdomain})`
    }
    return mobileConfig.studioName
  }, [studioSubdomain])

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    try {
      await signIn(email.trim(), password, studioSubdomain.trim().toLowerCase())
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
        <View style={[styles.brandCard, { borderColor: withOpacity(mobileConfig.primaryColor, 0.32), backgroundColor: withOpacity(mobileConfig.primaryColor, 0.1) }]}>
          <Text style={styles.kicker}>CURRENT Mobile</Text>
          <Text style={styles.title}>Welcome to {studioLabel}</Text>
          <Text style={styles.subtitle}>Sign in as studio owner, teacher, or client.</Text>
        </View>
        {!mobileConfig.studioSubdomain ? (
          <Text style={styles.warning}>Studio subdomain is missing in mobile env config.</Text>
        ) : null}
        {mobileConfig.allowSubdomainOverride ? (
          <Text style={styles.warning}>Subdomain override is enabled for this build.</Text>
        ) : null}

        {showSubdomainInput ? (
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Studio subdomain"
            value={studioSubdomain}
            onChangeText={setStudioSubdomain}
            style={styles.input}
          />
        ) : null}

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

        <Pressable onPress={handleLogin} disabled={!canSubmit} style={[styles.button, !canSubmit && styles.buttonDisabled]}>
          <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Sign in"}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 12,
  },
  brandCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  kicker: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontSize: 11,
    color: mobileTheme.colors.textSubtle,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  subtitle: {
    marginBottom: 8,
    color: mobileTheme.colors.textMuted,
  },
  warning: {
    marginBottom: 8,
    color: "#b45309",
    fontSize: 13,
  },
  input: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: mobileTheme.colors.text,
    backgroundColor: mobileTheme.colors.surface,
  },
  button: {
    marginTop: 4,
    borderRadius: mobileTheme.radius.lg,
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
