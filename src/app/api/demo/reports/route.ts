import { NextRequest, NextResponse } from "next/server"
import { BookingStatus } from "@prisma/client"
import { db } from "@/lib/db"
import { runDbQueries } from "@/lib/db-query-mode"
import { getDemoStudioId } from "@/lib/demo-studio"
import { buildMarketingSummary } from "@/lib/reporting/marketing"
import { buildBookingSummary } from "@/lib/reporting/bookings"
import { buildClassesSummary } from "@/lib/reporting/classes"
import { buildInstructorRows } from "@/lib/reporting/instructors"
import { buildSocialSummary } from "@/lib/reporting/social"
import { buildRevenueSummary } from "@/lib/reporting/revenue-summary"
import {
  buildActiveClientVisitIndex,
  buildAtRiskCandidates,
  buildClientSummary,
} from "@/lib/reporting/retention"
import { buildRetentionSummary } from "@/lib/reporting/retention-summary"
import { resolveDefaultStudioReportRange } from "@/lib/reporting/date-range"

const ATTENDED_BOOKING_STATUS_LIST: BookingStatus[] = ["CONFIRMED", "COMPLETED", "NO_SHOW"]

export async function GET(request: NextRequest) {
  const studioId = await getDemoStudioId()
  if (!studioId) {
    return NextResponse.json({ error: "Demo studio not configured" }, { status: 404 })
  }

  const searchParams = request.nextUrl.searchParams
  const { days, startDate, reportEndDate, previousStartDate } = resolveDefaultStudioReportRange(
    {
      days: searchParams.get("days"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate"),
    }
  )

  try {
    const monthWindowStart = new Date(reportEndDate)
    monthWindowStart.setMonth(monthWindowStart.getMonth() - 5)
    monthWindowStart.setDate(1)
    monthWindowStart.setHours(0, 0, 0, 0)

  const [bookings, previousBookings, monthlyBookings, classSessions] = await runDbQueries([
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: startDate,
            lt: reportEndDate
          }
        }
      },
      select: {
        status: true,
        clientId: true,
        paidAmount: true,
        classSession: {
          select: {
            startTime: true,
            teacherId: true,
            classType: {
              select: {
                name: true,
                price: true
              }
            },
            location: {
              select: {
                name: true
              }
            }
          }
        }
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      },
      select: {
        status: true,
        paidAmount: true,
        classSession: {
          select: {
            teacherId: true,
            classType: {
              select: {
                price: true
              }
            }
          }
        }
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        classSession: {
          startTime: {
            gte: monthWindowStart,
            lt: reportEndDate
          }
        }
      },
      select: {
        status: true,
        classSession: {
          select: {
            startTime: true,
            classType: {
              select: {
                price: true
              }
            }
          }
        },
        paidAmount: true
      }
    }),
    () => db.classSession.findMany({
      where: {
        studioId,
        startTime: {
          gte: startDate,
          lt: reportEndDate
        }
      },
      select: {
        id: true,
        studioId: true,
        teacherId: true,
        classTypeId: true,
        capacity: true,
        startTime: true,
        classType: {
          select: {
            name: true,
            price: true
          }
        },
        location: {
          select: {
            name: true
          }
        },
        teacher: {
          select: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        bookings: {
          select: {
            status: true,
            paidAmount: true,
            clientId: true
          }
        },
        _count: {
          select: { waitlists: true }
        }
      }
    })
  ])

  const [
    totalClients,
    newClients,
    activeClients,
    churnedClients,
    previousClassCounts,
    studioTeachers,
    studioClients,
    cancelledBookingsInPeriod
  ] = await runDbQueries([
    () => db.client.count({ where: { studioId } }),
    () => db.client.count({
      where: {
        studioId,
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        }
      }
    }),
    () => db.client.count({
      where: {
        studioId,
        isActive: true
      }
    }),
    () => db.client.count({
      where: {
        studioId,
        isActive: false
      }
    }),
    () => db.classSession.groupBy({
      by: ["teacherId"] as const,
      where: {
        studioId,
        startTime: {
          gte: previousStartDate,
          lt: startDate
        }
      },
      _count: {
        teacherId: true
      },
      orderBy: {
        teacherId: "asc"
      }
    }),
    () => db.teacher.findMany({
      where: {
        studioId
      },
      select: {
        id: true,
        isActive: true,
        specialties: true,
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    () => db.client.findMany({
      where: {
        studioId
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        credits: true,
        createdAt: true
      }
    }),
    () => db.booking.findMany({
      where: {
        studioId,
        status: "CANCELLED",
        classSession: {
          startTime: {
            gte: startDate,
            lt: reportEndDate
          }
        }
      },
      select: {
        cancellationReason: true
      }
    })
  ])

  const [periodMessages, previousPeriodMessages, reminderAutomations, winbackAutomations] = await runDbQueries([
    () => db.message.findMany({
      where: {
        studioId,
        direction: "OUTBOUND",
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        }
      },
      select: {
        id: true,
        channel: true,
        status: true,
        clientId: true,
        campaignId: true,
        automationId: true,
        openedAt: true,
        clickedAt: true
      }
    }),
    () => db.message.findMany({
      where: {
        studioId,
        direction: "OUTBOUND",
        createdAt: {
          gte: previousStartDate,
          lt: startDate
        }
      },
      select: {
        id: true,
        channel: true,
        status: true,
        clientId: true,
        campaignId: true,
        automationId: true,
        openedAt: true,
        clickedAt: true
      }
    }),
    () => db.automation.findMany({
      where: {
        studioId,
        trigger: "CLASS_REMINDER"
      },
      select: {
        id: true
      }
    }),
    () => db.automation.findMany({
      where: {
        studioId,
        trigger: "CLIENT_INACTIVE"
      },
      select: {
        id: true
      }
    })
  ])

  const [activeSocialFlows, totalSocialTriggered, totalSocialResponded, totalSocialBooked] = await runDbQueries([
    () => db.socialMediaFlow.count({
      where: {
        isActive: true,
        account: {
          OR: [{ studioId }, { teacher: { studioId } }]
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        responseSent: true,
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    }),
    () => db.socialMediaFlowEvent.count({
      where: {
        createdAt: {
          gte: startDate,
          lt: reportEndDate
        },
        converted: true,
        flow: {
          account: {
            OR: [{ studioId }, { teacher: { studioId } }]
          }
        }
      }
    })
  ])

  const activityLookbackStart = new Date(reportEndDate)
  activityLookbackStart.setDate(activityLookbackStart.getDate() - 365)

  const activeClientVisitRows = await db.booking.findMany({
    where: {
      studioId,
      status: {
        in: ATTENDED_BOOKING_STATUS_LIST
      },
      client: {
        isActive: true
      },
      classSession: {
        startTime: {
          gte: activityLookbackStart,
          lt: reportEndDate
        }
      }
    },
    select: {
      clientId: true,
      classSession: {
        select: {
          startTime: true
        }
      }
    },
    orderBy: {
      classSession: {
        startTime: "desc"
      }
    }
  })

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

  const previousClassCountByTeacherId = new Map(
    previousClassCounts.map((row) => {
      const count =
        typeof row._count === "object" &&
        row._count !== null &&
        "teacherId" in row._count &&
        typeof row._count.teacherId === "number"
          ? row._count.teacherId
          : 0
      return [row.teacherId, count] as const
    })
  )
  const instructorRows = buildInstructorRows({
    classSessions,
    studioTeachers,
    previousClassCountByTeacherId,
  })

  const {
    visitCountByClientId,
    lastVisitByClientId,
    recentlyActiveClientIds,
  } = buildActiveClientVisitIndex(activeClientVisitRows, reportEndDate)

  const activeClientsList = studioClients.filter((client) => client.isActive)
  const atRiskCandidates = buildAtRiskCandidates(
    studioClients,
    lastVisitByClientId,
    visitCountByClientId,
    reportEndDate
  )

  const retention = buildRetentionSummary({
    atRiskCandidates,
    activeClientsList,
    recentlyActiveClientIds,
    cancelledBookingsInPeriod,
    reportEndDate,
    churnedClients,
    totalClients,
  })

    return NextResponse.json({
    revenue,
    clients: buildClientSummary(totalClients, newClients, activeClients, churnedClients),
    instructors: instructorRows,
    retention,
    classes: classesSummary,
    bookings: bookingSummary,
    marketing,
    social,
    range: {
      days,
      startDate: startDate.toISOString(),
      endDate: reportEndDate.toISOString()
    }
    })
  } catch (error) {
    console.error("Failed to load full reports payload:", error)

    try {
      const [totalClients, activeClients, churnedClients, newClients] = await runDbQueries([
        () => db.client.count({ where: { studioId } }),
        () => db.client.count({ where: { studioId, isActive: true } }),
        () => db.client.count({ where: { studioId, isActive: false } }),
        () => db.client.count({
          where: {
            studioId,
            createdAt: {
              gte: startDate,
              lt: reportEndDate
            }
          }
        })
      ])

      return NextResponse.json({
        revenue: {
          total: 0,
          previousTotal: 0,
          byLocation: [],
          byClassType: [],
          monthly: []
        },
        clients: buildClientSummary(totalClients, newClients, activeClients, churnedClients),
        instructors: [],
        retention: {
          atRiskClients: 0,
          atRiskList: [],
          membershipBreakdown: [],
          churnReasons: [],
          cohortRetention: []
        },
        classes: {
          total: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          averageFill: 0,
          byLocation: [],
          byTeacher: [],
          byTimeSlot: [],
          byDay: [],
          topClasses: [],
          underperforming: []
        },
        bookings: {
          total: 0,
          uniqueClients: 0,
          newClientBookings: 0,
          averageBookingsPerClient: 0,
          byStatus: []
        },
        marketing: {
          emailsSent: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          previousEmailOpenRate: 0,
          previousEmailClickRate: 0,
          bookingsFromEmail: 0,
          remindersSent: 0,
          noShowRate: 0,
          previousNoShowRate: 0,
          winbackSuccess: 0,
          campaigns: [],
          insights: [{ type: "warning", message: "Partial reports payload returned due to data timeout. Retry shortly." }]
        },
        social: {
          activeFlows: 0,
          totalTriggered: 0,
          totalResponded: 0,
          totalBooked: 0,
          conversionRate: 0
        },
        range: {
          days,
          startDate: startDate.toISOString(),
          endDate: reportEndDate.toISOString()
        },
        partial: true
      })
    } catch (fallbackError) {
      console.error("Failed to build fallback reports payload:", fallbackError)
      return NextResponse.json({
        revenue: {
          total: 0,
          previousTotal: 0,
          byLocation: [],
          byClassType: [],
          monthly: []
        },
        clients: buildClientSummary(0, 0, 0, 0),
        instructors: [],
        retention: {
          atRiskClients: 0,
          atRiskList: [],
          membershipBreakdown: [],
          churnReasons: [],
          cohortRetention: [],
          churnRate: 0,
          churnDefinition: "inactive clients / total clients"
        },
        classes: {
          total: 0,
          totalCapacity: 0,
          totalAttendance: 0,
          averageFill: 0,
          byLocation: [],
          byTeacher: [],
          byTimeSlot: [],
          byDay: [],
          topClasses: [],
          underperforming: []
        },
        bookings: {
          total: 0,
          uniqueClients: 0,
          newClientBookings: 0,
          averageBookingsPerClient: 0,
          byStatus: []
        },
        marketing: {
          emailsSent: 0,
          emailOpenRate: 0,
          emailClickRate: 0,
          previousEmailOpenRate: 0,
          previousEmailClickRate: 0,
          bookingsFromEmail: 0,
          remindersSent: 0,
          noShowRate: 0,
          previousNoShowRate: 0,
          winbackSuccess: 0,
          campaigns: [],
          insights: [{ type: "warning", message: "Reports are temporarily degraded. Retry in a moment." }]
        },
        social: {
          activeFlows: 0,
          totalTriggered: 0,
          totalResponded: 0,
          totalBooked: 0,
          conversionRate: 0
        },
        range: {
          days,
          startDate: startDate.toISOString(),
          endDate: reportEndDate.toISOString()
        },
        partial: true
      })
    }
  }
}
