import { Pressable, StyleSheet, Text, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"

export default function ProfileScreen() {
  const { user, signOut } = useAuth()

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.row}>Name: {user?.firstName} {user?.lastName}</Text>
      <Text style={styles.row}>Email: {user?.email}</Text>
      <Text style={styles.row}>Role: {user?.role}</Text>

      <Pressable style={styles.button} onPress={() => void signOut()}>
        <Text style={styles.buttonText}>Sign out</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 24, fontWeight: "700", color: "#0f172a" },
  row: { color: "#334155" },
  button: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#1d4ed8",
    alignItems: "center",
  },
  buttonText: { color: "white", fontWeight: "700" },
})
