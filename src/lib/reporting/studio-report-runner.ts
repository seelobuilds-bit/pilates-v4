import { NextResponse } from "next/server"
import { buildMarketingSummary } from "@/lib/reporting/marketing"
import { buildBookingSummary } from "@/lib/reporting/bookings"
import { buildClassesSummary } from "@/lib/reporting/classes"
import { buildInstructorRows, buildPreviousClassCountByTeacherId } from "@/lib/reporting/instructors"
import { buildSocialSummary } from "@/lib/reporting/social"
import { buildRevenueSummary } from "@/lib/reporting/revenue-summary"
import {
  buildRetentionAndClientSummary,
} from "@/lib/reporting/retention-composition"
import { loadStudioReportData } from "@/lib/reporting/studio-report-loader"
import { buildStudioReportPayload } from "./studio-report-payload"

type StudioReportLoadedData = Awaited<ReturnType<typeof loadStudioReportData>>

export async function runStudioReport(args: {
  studioId: string
  days: number
  startDate: Date
  reportEndDate: Date
  data: StudioReportLoadedData
}) {
  const { studioId, days, startDate, reportEndDate, data } = args
  const {
    bookings,
    previousBookings,
    monthlyBookings,
    classSessions,
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod,
    periodMessages,
    previousPeriodMessages,
    reminderAutomations,
    winbackAutomations,
    activeSocialFlows,
    totalSocialTriggered,
    totalSocialResponded,
    totalSocialBooked,
    activeClientVisitRows,
  } = data

  const revenue = buildRevenueSummary({
    bookings,
    previousBookings,
    monthlyBookings,
  })

  const classesSummary = buildClassesSummary(classSessions)

  const clientCreatedAtById = new Map(studioClients.map((client) => [client.id, client.createdAt]))
  const bookingSummary = buildBookingSummary({
    bookings,
    clientCreatedAtById,
    startDate,
    reportEndDate,
  })

  const marketing = await buildMarketingSummary({
    studioId,
    startDate,
    reportEndDate,
    periodMessages,
    previousPeriodMessages,
    reminderAutomations,
    winbackAutomations,
    bookings,
    previousBookings,
  })

  const social = buildSocialSummary({
    activeFlows: activeSocialFlows,
    totalTriggered: totalSocialTriggered,
    totalResponded: totalSocialResponded,
    totalBooked: totalSocialBooked,
  })

  const previousClassCountByTeacherId = buildPreviousClassCountByTeacherId(previousClassCounts)
  const instructorRows = buildInstructorRows({
    classSessions,
    studioTeachers,
    previousClassCountByTeacherId,
  })

  const { clients, retention } = await buildRetentionAndClientSummary({
    studioClients,
    activeClientVisitRows,
    cancelledBookingsInPeriod,
    reportEndDate,
    totalClients,
    newClients,
    activeClients,
    churnedClients,
  })

  return NextResponse.json(
    buildStudioReportPayload({
      days,
      startDate,
      reportEndDate,
      revenue,
      clients,
      instructors: instructorRows,
      retention,
      classes: classesSummary,
      bookings: bookingSummary,
      marketing,
      social,
    })
  )
}
