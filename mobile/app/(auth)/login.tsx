import { useMemo, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
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
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View
              style={[
                styles.brandCard,
                {
                  borderColor: withOpacity(mobileConfig.primaryColor, 0.32),
                  backgroundColor: withOpacity(mobileConfig.primaryColor, 0.1),
                },
              ]}
            >
              <Text style={styles.kicker}>CURRENT Mobile</Text>
              <Text style={styles.title}>Sign in to {studioLabel}</Text>
              <Text style={styles.subtitle}>Use the same login you use on the web.</Text>
            </View>
            {!mobileConfig.studioSubdomain ? (
              <Text style={styles.warning}>This build is missing a studio subdomain in its mobile config.</Text>
            ) : null}
            {mobileConfig.allowSubdomainOverride ? (
              <Text style={styles.warning}>Studio override is enabled for internal testing.</Text>
            ) : null}

            <View style={styles.formCard}>
              {showSubdomainInput ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>Studio subdomain</Text>
                  <TextInput
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="your-studio"
                    value={studioSubdomain}
                    onChangeText={setStudioSubdomain}
                    style={styles.input}
                  />
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  style={styles.input}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TextInput
                  secureTextEntry
                  placeholder="Your password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable onPress={handleLogin} disabled={!canSubmit} style={[styles.button, !canSubmit && styles.buttonDisabled]}>
                <Text style={styles.buttonText}>{submitting ? "Signing in..." : "Sign in"}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
  },
  keyboardWrap: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 24,
    gap: 14,
  },
  brandCard: {
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 6,
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
    color: mobileTheme.colors.textMuted,
  },
  formCard: {
    borderRadius: mobileTheme.radius.xl,
    backgroundColor: mobileTheme.colors.surface,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 14,
    gap: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: mobileTheme.colors.textMuted,
  },
  warning: {
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
  },
})
