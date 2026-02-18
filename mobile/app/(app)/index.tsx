import { useEffect } from "react"
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  )
}

export default function HomeScreen() {
  const { user, bootstrap, refreshBootstrap, loading } = useAuth()

  useEffect(() => {
    void refreshBootstrap()
  }, [refreshBootstrap])

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refreshBootstrap()} />}
    >
      <Text style={styles.heading}>Hello {user?.firstName ?? "there"}</Text>
      <Text style={styles.subheading}>Role: {user?.role ?? "-"}</Text>
      <Text style={styles.subheading}>Studio: {bootstrap?.studio?.name ?? user?.studio?.name ?? "-"}</Text>

      <View style={styles.metricsGrid}>
        {Object.entries(bootstrap?.metrics || {}).map(([key, value]) => (
          <MetricCard key={key} label={key} value={Number(value) || 0} />
        ))}
      </View>

      {!bootstrap ? <Text style={styles.note}>No bootstrap data yet. Pull to refresh.</Text> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  subheading: {
    color: "#334155",
  },
  metricsGrid: {
    marginTop: 10,
    gap: 10,
  },
  metricCard: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 12,
  },
  metricLabel: {
    color: "#64748b",
    textTransform: "capitalize",
  },
  metricValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  note: {
    marginTop: 14,
    color: "#64748b",
  },
})
