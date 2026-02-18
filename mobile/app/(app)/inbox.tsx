import { StyleSheet, Text, View } from "react-native"

export default function InboxScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inbox</Text>
      <Text style={styles.body}>Phase 1 foundation complete. Inbox threads and composer wiring are next.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  body: { color: "#334155" },
})
