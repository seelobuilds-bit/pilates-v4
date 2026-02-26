import { useCallback, useEffect, useMemo, useState } from "react"
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { useRouter } from "expo-router"
import { useAuth } from "@/src/context/auth-context"
import { mobileApi } from "@/src/lib/api"
import { getStudioPrimaryColor, mobileTheme, withOpacity } from "@/src/lib/theme"
import type {
  MobileMarketingAutomationSummary,
  MobileMarketingCampaignSummary,
  MobileMarketingChannel,
  MobileMarketingResponse,
  MobileMarketingTrigger,
} from "@/src/types/mobile"

const CAMPAIGN_STATUS_OPTIONS = ["DRAFT", "SCHEDULED", "SENDING", "SENT", "PAUSED", "CANCELLED"] as const
const AUTOMATION_STATUS_OPTIONS = ["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"] as const
const CHANNEL_OPTIONS: MobileMarketingChannel[] = ["EMAIL", "SMS"]
const TRIGGER_OPTIONS: { value: MobileMarketingTrigger; label: string }[] = [
  { value: "WELCOME", label: "Welcome" },
  { value: "CLASS_REMINDER", label: "Class Reminder" },
  { value: "CLASS_FOLLOWUP", label: "Class Follow-up" },
  { value: "BOOKING_CONFIRMED", label: "Booking Confirmed" },
  { value: "BOOKING_CANCELLED", label: "Booking Cancelled" },
  { value: "CLIENT_INACTIVE", label: "Client Inactive" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "MEMBERSHIP_EXPIRING", label: "Membership Expiring" },
]

function formatDate(value: string | null) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function CampaignCard({
  item,
  onViewDetails,
  onCancelCampaign,
  isUpdating,
  primaryColor,
}: {
  item: MobileMarketingCampaignSummary
  onViewDetails: (campaignId: string) => void
  onCancelCampaign: (campaignId: string) => void
  isUpdating: boolean
  primaryColor: string
}) {
  const canCancel = item.status === "SCHEDULED"

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.channel}</Text>
        <Text style={styles.metaPill}>Recipients {item.totalRecipients}</Text>
        <Text style={styles.metaPill}>Sent {item.sentCount}</Text>
        <Text style={styles.metaPill}>Delivered {item.deliveredCount}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Opened {item.openedCount}</Text>
        <Text style={styles.metaPill}>Clicked {item.clickedCount}</Text>
        <Text style={styles.metaPill}>Failed {item.failedCount}</Text>
      </View>
      <Text style={styles.metaText}>Scheduled {formatDate(item.scheduledAt)} · Sent {formatDate(item.sentAt)}</Text>
      {canCancel ? (
        <Pressable
          disabled={isUpdating}
          style={[styles.inlineActionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
          onPress={() => onCancelCampaign(item.id)}
        >
          <Text style={[styles.inlineActionText, { color: primaryColor }]}>{isUpdating ? "Updating..." : "Cancel Scheduled"}</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

function AutomationCard({
  item,
  onViewDetails,
  onToggleAutomation,
  isUpdating,
  primaryColor,
}: {
  item: MobileMarketingAutomationSummary
  onViewDetails: (automationId: string) => void
  onToggleAutomation: (automationId: string, action: "activate" | "pause") => void
  isUpdating: boolean
  primaryColor: string
}) {
  const action = item.status === "ACTIVE" ? "pause" : item.status === "PAUSED" || item.status === "DRAFT" ? "activate" : null
  const actionLabel = action === "pause" ? "Pause Automation" : action === "activate" ? "Activate Automation" : null

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.statusBadge}>{item.status}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>{item.channel}</Text>
        <Text style={styles.metaPill}>{item.trigger}</Text>
        <Text style={styles.metaPill}>Steps {item.stepCount}</Text>
      </View>
      <View style={styles.pillRow}>
        <Text style={styles.metaPill}>Sent {item.totalSent}</Text>
        <Text style={styles.metaPill}>Delivered {item.totalDelivered}</Text>
        <Text style={styles.metaPill}>Opened {item.totalOpened}</Text>
        <Text style={styles.metaPill}>Clicked {item.totalClicked}</Text>
      </View>
      <Text style={styles.metaText}>Updated {formatDate(item.updatedAt)}</Text>
      {action && actionLabel ? (
        <Pressable
          disabled={isUpdating}
          style={[styles.inlineActionButton, { borderColor: primaryColor, backgroundColor: withOpacity(primaryColor, 0.12) }]}
          onPress={() => onToggleAutomation(item.id, action)}
        >
          <Text style={[styles.inlineActionText, { color: primaryColor }]}>{isUpdating ? "Updating..." : actionLabel}</Text>
        </Pressable>
      ) : null}
      <Pressable style={styles.detailsButton} onPress={() => onViewDetails(item.id)}>
        <Text style={styles.detailsButtonText}>View Details</Text>
      </Pressable>
    </View>
  )
}

export default function MarketingScreen() {
  const router = useRouter()
  const { token, user } = useAuth()
  const primaryColor = getStudioPrimaryColor()

  const [data, setData] = useState<MobileMarketingResponse | null>(null)
  const [search, setSearch] = useState("")
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<"ALL" | MobileMarketingCampaignSummary["status"]>("ALL")
  const [automationStatusFilter, setAutomationStatusFilter] = useState<"ALL" | MobileMarketingAutomationSummary["status"]>("ALL")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [createMode, setCreateMode] = useState<"none" | "campaign" | "automation">("none")
  const [campaignDraft, setCampaignDraft] = useState({
    name: "",
    channel: "EMAIL" as MobileMarketingChannel,
    subject: "",
    body: "",
  })
  const [automationDraft, setAutomationDraft] = useState({
    name: "",
    trigger: "WELCOME" as MobileMarketingTrigger,
    channel: "EMAIL" as MobileMarketingChannel,
    subject: "",
    body: "",
    delayMinutes: "0",
    stopOnBooking: true,
  })
  const [error, setError] = useState<string | null>(null)

  const isAllowedRole = user?.role === "OWNER"
  const trimmedSearch = search.trim()

  const loadMarketing = useCallback(
    async (isRefresh = false) => {
      if (!token || !isAllowedRole) {
        setLoading(false)
        setData(null)
        return
      }

      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      setError(null)
      try {
        const response = await mobileApi.marketing(token, {
          search: trimmedSearch || undefined,
        })
        setData(response)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load marketing"
        setError(message)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [isAllowedRole, token, trimmedSearch]
  )

  useEffect(() => {
    const timeout = setTimeout(() => {
      void loadMarketing()
    }, 220)

    return () => clearTimeout(timeout)
  }, [loadMarketing])

  const emptyText = useMemo(() => {
    if (!isAllowedRole) return "Marketing is available for studio owner accounts only."
    if (trimmedSearch) return "No campaigns or automations matched your search."
    return "No marketing activity yet."
  }, [isAllowedRole, trimmedSearch])

  const handleViewCampaignDetails = useCallback(
    (campaignId: string) => {
      router.push(`/(app)/marketing/${campaignId}` as never)
    },
    [router]
  )

  const handleViewAutomationDetails = useCallback(
    (automationId: string) => {
      router.push(`/(app)/marketing/automations/${automationId}` as never)
    },
    [router]
  )

  const handleCancelCampaign = useCallback(
    async (campaignId: string) => {
      if (!token) return
      setUpdatingItemId(campaignId)
      setError(null)
      try {
        await mobileApi.marketingCampaignStatus(token, campaignId, "cancel")
        await loadMarketing(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update campaign status"
        setError(message)
      } finally {
        setUpdatingItemId(null)
      }
    },
    [loadMarketing, token]
  )

  const handleToggleAutomationStatus = useCallback(
    async (automationId: string, action: "activate" | "pause") => {
      if (!token) return
      setUpdatingItemId(automationId)
      setError(null)
      try {
        await mobileApi.marketingAutomationStatus(token, automationId, action)
        await loadMarketing(true)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update automation status"
        setError(message)
      } finally {
        setUpdatingItemId(null)
      }
    },
    [loadMarketing, token]
  )

  const handleCreateCampaign = useCallback(async () => {
    if (!token) return
    const name = campaignDraft.name.trim()
    const body = campaignDraft.body.trim()
    const subject = campaignDraft.subject.trim()
    if (!name || !body) {
      setError("Campaign name and body are required.")
      return
    }
    if (campaignDraft.channel === "EMAIL" && !subject) {
      setError("Email campaigns require a subject.")
      return
    }

    setCreating(true)
    setError(null)
    try {
      await mobileApi.marketingCreateCampaign(token, {
        name,
        channel: campaignDraft.channel,
        subject: subject || null,
        body,
      })
      setCampaignDraft({
        name: "",
        channel: "EMAIL",
        subject: "",
        body: "",
      })
      setCreateMode("none")
      await loadMarketing(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create campaign"
      setError(message)
    } finally {
      setCreating(false)
    }
  }, [campaignDraft.body, campaignDraft.channel, campaignDraft.name, campaignDraft.subject, loadMarketing, token])

  const handleCreateAutomation = useCallback(async () => {
    if (!token) return
    const name = automationDraft.name.trim()
    const body = automationDraft.body.trim()
    const subject = automationDraft.subject.trim()
    const parsedDelay = Number(automationDraft.delayMinutes)
    const delayMinutes = Number.isFinite(parsedDelay) ? Math.max(0, Math.round(parsedDelay)) : 0
    if (!name || !body) {
      setError("Automation name and message are required.")
      return
    }
    if (automationDraft.channel === "EMAIL" && !subject) {
      setError("Email automations require a subject.")
      return
    }

    setCreating(true)
    setError(null)
    try {
      await mobileApi.marketingCreateAutomation(token, {
        name,
        trigger: automationDraft.trigger,
        channel: automationDraft.channel,
        subject: subject || null,
        body,
        delayMinutes,
        stopOnBooking: automationDraft.stopOnBooking,
      })
      setAutomationDraft({
        name: "",
        trigger: "WELCOME",
        channel: "EMAIL",
        subject: "",
        body: "",
        delayMinutes: "0",
        stopOnBooking: true,
      })
      setCreateMode("none")
      await loadMarketing(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create automation"
      setError(message)
    } finally {
      setCreating(false)
    }
  }, [
    automationDraft.body,
    automationDraft.channel,
    automationDraft.delayMinutes,
    automationDraft.name,
    automationDraft.stopOnBooking,
    automationDraft.subject,
    automationDraft.trigger,
    loadMarketing,
    token,
  ])

  const campaignStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: data?.campaigns.length ?? 0 }
    for (const campaign of data?.campaigns || []) {
      counts[campaign.status] = (counts[campaign.status] ?? 0) + 1
    }
    return counts
  }, [data?.campaigns])

  const automationStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: data?.automations.length ?? 0 }
    for (const automation of data?.automations || []) {
      counts[automation.status] = (counts[automation.status] ?? 0) + 1
    }
    return counts
  }, [data?.automations])

  const filteredCampaigns = useMemo(() => {
    if (!data?.campaigns) return []
    if (campaignStatusFilter === "ALL") return data.campaigns
    return data.campaigns.filter((campaign) => campaign.status === campaignStatusFilter)
  }, [campaignStatusFilter, data?.campaigns])

  const filteredAutomations = useMemo(() => {
    if (!data?.automations) return []
    if (automationStatusFilter === "ALL") return data.automations
    return data.automations.filter((automation) => automation.status === automationStatusFilter)
  }, [automationStatusFilter, data?.automations])

  return (
    <View style={styles.container}>
      <View style={[styles.headerCard, { borderColor: withOpacity(primaryColor, 0.25), backgroundColor: withOpacity(primaryColor, 0.09) }]}>
        <Text style={styles.title}>Marketing</Text>
        <Text style={styles.subtitle}>Campaign and automation performance overview</Text>
        {data ? (
          <View style={styles.statsRow}>
            <Text style={styles.statPill}>Campaigns {data.stats.campaignsTotal}</Text>
            <Text style={styles.statPill}>Scheduled {data.stats.campaignsScheduled}</Text>
            <Text style={styles.statPill}>Sent {data.stats.campaignsSent}</Text>
            <Text style={styles.statPill}>Automations {data.stats.automationsTotal}</Text>
            <Text style={styles.statPill}>Active {data.stats.automationsActive}</Text>
            <Text style={styles.statPill}>Draft {data.stats.automationsDraft}</Text>
          </View>
        ) : null}
      </View>

      <TextInput value={search} onChangeText={setSearch} placeholder="Search campaigns and automations..." style={styles.searchInput} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {!isAllowedRole ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>{emptyText}</Text>
          <Pressable style={[styles.actionButton, { backgroundColor: primaryColor }]} onPress={() => router.push("/(app)/workspace")}>
            <Text style={styles.actionButtonText}>Go to workspace</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadMarketing(true)} />}
        >
          {loading ? null : data && (data.campaigns.length > 0 || data.automations.length > 0) ? (
            <>
              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Campaign Filters</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      campaignStatusFilter === "ALL" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setCampaignStatusFilter("ALL")}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        campaignStatusFilter === "ALL" && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      {`All (${campaignStatusCounts.ALL ?? 0})`}
                    </Text>
                  </Pressable>
                  {CAMPAIGN_STATUS_OPTIONS.map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.filterChip,
                        campaignStatusFilter === status && {
                          borderColor: primaryColor,
                          backgroundColor: withOpacity(primaryColor, 0.14),
                        },
                      ]}
                      onPress={() => setCampaignStatusFilter(status)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          campaignStatusFilter === status && { color: primaryColor, fontWeight: "700" },
                        ]}
                      >
                        {`${status} (${campaignStatusCounts[status] ?? 0})`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterLabel}>Automation Filters</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      automationStatusFilter === "ALL" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setAutomationStatusFilter("ALL")}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        automationStatusFilter === "ALL" && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      {`All (${automationStatusCounts.ALL ?? 0})`}
                    </Text>
                  </Pressable>
                  {AUTOMATION_STATUS_OPTIONS.map((status) => (
                    <Pressable
                      key={status}
                      style={[
                        styles.filterChip,
                        automationStatusFilter === status && {
                          borderColor: primaryColor,
                          backgroundColor: withOpacity(primaryColor, 0.14),
                        },
                      ]}
                      onPress={() => setAutomationStatusFilter(status)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          automationStatusFilter === status && { color: primaryColor, fontWeight: "700" },
                        ]}
                      >
                        {`${status} (${automationStatusCounts[status] ?? 0})`}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.footerSection}>
                <Text style={styles.sectionTitle}>Create In App</Text>
                <View style={styles.filterRow}>
                  <Pressable
                    style={[
                      styles.filterChip,
                      createMode === "campaign" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setCreateMode((prev) => (prev === "campaign" ? "none" : "campaign"))}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        createMode === "campaign" && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      New Campaign
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.filterChip,
                      createMode === "automation" && {
                        borderColor: primaryColor,
                        backgroundColor: withOpacity(primaryColor, 0.14),
                      },
                    ]}
                    onPress={() => setCreateMode((prev) => (prev === "automation" ? "none" : "automation"))}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        createMode === "automation" && { color: primaryColor, fontWeight: "700" },
                      ]}
                    >
                      New Automation
                    </Text>
                  </Pressable>
                </View>

                {createMode === "campaign" ? (
                  <View style={styles.formWrap}>
                    <TextInput
                      value={campaignDraft.name}
                      onChangeText={(value) => setCampaignDraft((prev) => ({ ...prev, name: value }))}
                      placeholder="Campaign name"
                      style={styles.searchInput}
                    />
                    <View style={styles.filterRow}>
                      {CHANNEL_OPTIONS.map((option) => (
                        <Pressable
                          key={`campaign-${option}`}
                          style={[
                            styles.filterChip,
                            campaignDraft.channel === option && {
                              borderColor: primaryColor,
                              backgroundColor: withOpacity(primaryColor, 0.14),
                            },
                          ]}
                          onPress={() => setCampaignDraft((prev) => ({ ...prev, channel: option }))}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              campaignDraft.channel === option && { color: primaryColor, fontWeight: "700" },
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {campaignDraft.channel === "EMAIL" ? (
                      <TextInput
                        value={campaignDraft.subject}
                        onChangeText={(value) => setCampaignDraft((prev) => ({ ...prev, subject: value }))}
                        placeholder="Email subject"
                        style={styles.searchInput}
                      />
                    ) : null}
                    <TextInput
                      value={campaignDraft.body}
                      onChangeText={(value) => setCampaignDraft((prev) => ({ ...prev, body: value }))}
                      placeholder="Message body"
                      style={[styles.searchInput, styles.multilineInput]}
                      multiline
                    />
                    <View style={styles.buttonRow}>
                      <Pressable style={styles.detailsButton} onPress={() => setCreateMode("none")} disabled={creating}>
                        <Text style={styles.detailsButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: primaryColor }, creating && styles.actionButtonDisabled]}
                        onPress={() => void handleCreateCampaign()}
                        disabled={creating}
                      >
                        <Text style={styles.actionButtonText}>{creating ? "Saving..." : "Save Campaign Draft"}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}

                {createMode === "automation" ? (
                  <View style={styles.formWrap}>
                    <TextInput
                      value={automationDraft.name}
                      onChangeText={(value) => setAutomationDraft((prev) => ({ ...prev, name: value }))}
                      placeholder="Automation name"
                      style={styles.searchInput}
                    />
                    <View style={styles.filterRow}>
                      {TRIGGER_OPTIONS.map((option) => (
                        <Pressable
                          key={option.value}
                          style={[
                            styles.filterChip,
                            automationDraft.trigger === option.value && {
                              borderColor: primaryColor,
                              backgroundColor: withOpacity(primaryColor, 0.14),
                            },
                          ]}
                          onPress={() => setAutomationDraft((prev) => ({ ...prev, trigger: option.value }))}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              automationDraft.trigger === option.value && { color: primaryColor, fontWeight: "700" },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    <View style={styles.filterRow}>
                      {CHANNEL_OPTIONS.map((option) => (
                        <Pressable
                          key={`automation-${option}`}
                          style={[
                            styles.filterChip,
                            automationDraft.channel === option && {
                              borderColor: primaryColor,
                              backgroundColor: withOpacity(primaryColor, 0.14),
                            },
                          ]}
                          onPress={() => setAutomationDraft((prev) => ({ ...prev, channel: option }))}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              automationDraft.channel === option && { color: primaryColor, fontWeight: "700" },
                            ]}
                          >
                            {option}
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable
                        style={[
                          styles.filterChip,
                          automationDraft.stopOnBooking && {
                            borderColor: primaryColor,
                            backgroundColor: withOpacity(primaryColor, 0.14),
                          },
                        ]}
                        onPress={() => setAutomationDraft((prev) => ({ ...prev, stopOnBooking: !prev.stopOnBooking }))}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            automationDraft.stopOnBooking && { color: primaryColor, fontWeight: "700" },
                          ]}
                        >
                          Stop On Booking
                        </Text>
                      </Pressable>
                    </View>
                    {automationDraft.channel === "EMAIL" ? (
                      <TextInput
                        value={automationDraft.subject}
                        onChangeText={(value) => setAutomationDraft((prev) => ({ ...prev, subject: value }))}
                        placeholder="Email subject"
                        style={styles.searchInput}
                      />
                    ) : null}
                    <TextInput
                      value={automationDraft.body}
                      onChangeText={(value) => setAutomationDraft((prev) => ({ ...prev, body: value }))}
                      placeholder="First step message"
                      style={[styles.searchInput, styles.multilineInput]}
                      multiline
                    />
                    <TextInput
                      value={automationDraft.delayMinutes}
                      onChangeText={(value) => setAutomationDraft((prev) => ({ ...prev, delayMinutes: value }))}
                      placeholder="Delay minutes (0+)"
                      style={styles.searchInput}
                      keyboardType="numeric"
                    />
                    <View style={styles.buttonRow}>
                      <Pressable style={styles.detailsButton} onPress={() => setCreateMode("none")} disabled={creating}>
                        <Text style={styles.detailsButtonText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        style={[styles.actionButton, { backgroundColor: primaryColor }, creating && styles.actionButtonDisabled]}
                        onPress={() => void handleCreateAutomation()}
                        disabled={creating}
                      >
                        <Text style={styles.actionButtonText}>{creating ? "Saving..." : "Save Automation Draft"}</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recent Campaigns</Text>
                {filteredCampaigns.length > 0 ? (
                  filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      item={campaign}
                      onViewDetails={handleViewCampaignDetails}
                      onCancelCampaign={(campaignId) => void handleCancelCampaign(campaignId)}
                      isUpdating={updatingItemId === campaign.id}
                      primaryColor={primaryColor}
                    />
                  ))
                ) : (
                  <Text style={styles.metaText}>No campaigns match this filter.</Text>
                )}
              </View>

              <View style={styles.sectionWrap}>
                <Text style={styles.sectionTitle}>Recent Automations</Text>
                {filteredAutomations.length > 0 ? (
                  filteredAutomations.map((automation) => (
                    <AutomationCard
                      key={automation.id}
                      item={automation}
                      onViewDetails={handleViewAutomationDetails}
                      onToggleAutomation={(automationId, action) => void handleToggleAutomationStatus(automationId, action)}
                      isUpdating={updatingItemId === automation.id}
                      primaryColor={primaryColor}
                    />
                  ))
                ) : (
                  <Text style={styles.metaText}>No automations match this filter.</Text>
                )}
              </View>
            </>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}

          <View style={styles.footerSection}>
            <Text style={styles.metaText}>Campaign and automation drafts can now be created directly from mobile.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: mobileTheme.colors.canvas,
    padding: 16,
    gap: 10,
  },
  headerCard: {
    borderWidth: 1,
    borderRadius: mobileTheme.radius.xl,
    padding: 14,
    gap: 4,
  },
  title: {
    color: mobileTheme.colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    color: mobileTheme.colors.textMuted,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  statPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    color: mobileTheme.colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  scrollContent: {
    gap: 10,
    paddingBottom: 24,
  },
  filterSection: {
    gap: 6,
  },
  filterLabel: {
    color: mobileTheme.colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 999,
    backgroundColor: mobileTheme.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  filterChipText: {
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
  },
  sectionWrap: {
    gap: 8,
  },
  sectionTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.35,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#e2e8f0",
    color: mobileTheme.colors.textMuted,
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    backgroundColor: "#f8fafc",
    color: mobileTheme.colors.textMuted,
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detailsButton: {
    flex: 1,
    marginTop: 2,
    borderWidth: 1,
    borderColor: mobileTheme.colors.borderMuted,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    backgroundColor: mobileTheme.colors.surface,
  },
  inlineActionButton: {
    marginTop: 2,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  inlineActionText: {
    fontWeight: "700",
    fontSize: 12,
  },
  detailsButtonText: {
    color: mobileTheme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  metaText: {
    color: mobileTheme.colors.textSubtle,
    fontSize: 12,
  },
  footerSection: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 12,
    gap: 8,
  },
  formWrap: {
    gap: 8,
  },
  multilineInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 8,
  },
  errorText: {
    color: mobileTheme.colors.danger,
  },
  emptyWrap: {
    borderWidth: 1,
    borderColor: mobileTheme.colors.border,
    borderRadius: mobileTheme.radius.lg,
    backgroundColor: mobileTheme.colors.surface,
    padding: 14,
    gap: 8,
  },
  emptyText: {
    color: mobileTheme.colors.textSubtle,
  },
  actionButton: {
    flex: 1,
    borderRadius: mobileTheme.radius.lg,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
})
