import Constants from "expo-constants"
import * as Device from "expo-device"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"
import type { MobilePushPlatform, MobilePushRegisterParams } from "@/src/types/mobile"

export interface MobilePushRegistrationResult {
  enabled: boolean
  params?: MobilePushRegisterParams
  reason?: "not_device" | "permission_denied" | "missing_project_id" | "token_unavailable"
}

function getPlatform(): MobilePushPlatform {
  if (Platform.OS === "ios") return "IOS"
  if (Platform.OS === "android") return "ANDROID"
  if (Platform.OS === "web") return "WEB"
  return "UNKNOWN"
}

function getExpoProjectId(): string {
  const fromExtra = Constants.expoConfig?.extra?.eas?.projectId
  const fromEasConfig = (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId
  return String(fromExtra || fromEasConfig || "").trim()
}

function getBuildNumber(): string | null {
  if (Platform.OS === "ios") {
    return Constants.expoConfig?.ios?.buildNumber || null
  }

  if (Platform.OS === "android") {
    const versionCode = Constants.expoConfig?.android?.versionCode
    return typeof versionCode === "number" ? String(versionCode) : null
  }

  return null
}

export async function registerForPushNotificationsAsync(): Promise<MobilePushRegistrationResult> {
  if (!Device.isDevice) {
    return { enabled: false, reason: "not_device" }
  }

  const permissions = await Notifications.getPermissionsAsync()
  let finalStatus = permissions.status

  if (finalStatus !== "granted") {
    const requested = await Notifications.requestPermissionsAsync()
    finalStatus = requested.status
  }

  if (finalStatus !== "granted") {
    return { enabled: false, reason: "permission_denied" }
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#2563eb",
    })
  }

  const projectId = getExpoProjectId()
  if (!projectId) {
    return { enabled: false, reason: "missing_project_id" }
  }

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId })
  const expoPushToken = String(pushToken?.data || "").trim()
  if (!expoPushToken) {
    return { enabled: false, reason: "token_unavailable" }
  }

  const params: MobilePushRegisterParams = {
    expoPushToken,
    platform: getPlatform(),
    deviceId: (Device.modelId || Device.osBuildId || Device.modelName || "").trim() || null,
    appVersion: Constants.expoConfig?.version || null,
    buildNumber: getBuildNumber(),
  }

  return { enabled: true, params }
}
