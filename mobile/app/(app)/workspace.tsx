import { Ionicons } from "@expo/vector-icons"
import { useMemo, useState } from "react"
import { useRouter } from "expo-router"
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useAuth } from "@/src/context/auth-context"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import { getWorkspaceFeatures, toWorkspaceUrl, type WorkspaceFeature } from "@/src/lib/workspace-links"

const GROUP_ORDER: WorkspaceFeature["group"][] = [
  "Overview",
  "Operations",
  "People",
  "Growth",
  "Commerce",
  "Content",
  "Settings",
]

export default function WorkspaceScreen() {
  const { user, bootstrap } = useAuth()
  const router = useRouter()
  const primaryColor = getStudioPrimaryColor()
  const [search, setSearch] = useState("")
  const [openingFeatureId, setOpeningFeatureId] = useState<string | null>(null)
  const studioSubdomain = (bootstrap?.studio?.subdomain || user?.studio?.subdomain || "").trim().toLowerCase()
  const searchNormalized = search.trim().toLowerCase()

  const groupedFeatures = useMemo(() => {
    const allFeatures = getWorkspaceFeatures(user?.role, studioSubdomain)
    const filtered = allFeatures.filter((feature) => {
      if (!searchNormalized) {
        return true
      }
      const haystack = `${feature.label} ${feature.description} ${feature.group}`.toLowerCase()
      return haystack.includes(searchNormalized)
    })

    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((feature) => feature.group === group),
    })).filter((section) => section.items.length > 0)
  }, [searchNormalized, studioSubdomain, user?.role])

  const openFeature = async (feature: WorkspaceFeature) => {
    setOpeningFeatureId(feature.id)
    try {
      if (feature.target === "native" && feature.nativeRoute) {
        router.push(feature.nativeRoute as never)
        return
      }
      await Linking.openURL(toWorkspaceUrl(feature.href))
    } finally {
      setOpeningFeatureId(null)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Workspace</Text>
        <Text style={styles.subtitle}>Open any studio feature from mobile.</Text>
        <Text style={styles.metaText}>
          {bootstrap?.studio?.name || user?.studio?.name || "Studio"} {user?.role ? `- ${user.role}` : ""}
        </Text>
      </View>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search features..."
        style={[styles.searchInput, { borderColor: mobileTheme.colors.borderMuted }]}
      />

      {groupedFeatures.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No features found</Text>
          <Text style={styles.emptySubtitle}>Try a broader keyword.</Text>
        </View>
      ) : null}

      {groupedFeatures.map((section) => (
        <View key={section.group} style={styles.group}>
          <Text style={styles.groupTitle}>{section.group}</Text>
          <View style={styles.grid}>
            {section.items.map((feature) => {
              const opening = openingFeatureId === feature.id
              return (
                <Pressable
                  key={feature.id}
                  style={[
                    styles.card,
                    opening && { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.1) },
                  ]}
                  onPress={() => void openFeature(feature)}
                >
                  <View style={[styles.iconWrap, { backgroundColor: withOpacity(primaryColor, 0.16) }]}>
                    <Ionicons name={feature.icon as never} size={18} color={primaryColor} />
                  </View>
                  <Text style={styles.cardTitle}>{feature.label}</Text>
                  <Text style={styles.targetBadge}>{feature.target === "native" ? "In app" : "Web"}</Text>
                  <Text style={styles.cardDescription}>{opening ? "Opening..." : feature.description}</Text>
                </Pressable>
              )
            })}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
    backgroundColor: mobileTheme.colors.canvas,
  },
  headerCard: {
    backgroundColor: mobileTheme.colors.surface,
    borderRadius: mobileTheme.radius.xl,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    padding: 14,
    gap: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: mobileTheme.colors.text,
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
  },
  metaText: {
    marginTop: 3,
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: mobileTheme.colors.text,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "48.5%",
    minHeight: 108,
    borderRadius: mobileTheme.radius.lg,
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    backgroundColor: mobileTheme.colors.surface,
    padding: 10,
    gap: 5,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  targetBadge: {
    color: mobileTheme.colors.textFaint,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  cardDescription: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
    lineHeight: 16,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 3,
  },
  emptyTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
  },
  emptySubtitle: {
    color: mobileTheme.colors.textSubtle,
  },
})
