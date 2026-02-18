import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

function buildTrackingScope(user: { studioId: string; teacherId?: string | null }) {
  if (user.teacherId) {
    return {
      OR: [
        { studioId: user.studioId },
        { teacherId: user.teacherId },
      ],
    }
  }

  return {
    OR: [
      { studioId: user.studioId },
      { teacher: { studioId: user.studioId } },
    ],
  }
}

// GET - Fetch tracking links
export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const teacherIdParam = searchParams.get("teacherId")

  try {
    let teacherIdFilter: string | null = null
    if (teacherIdParam) {
      if (session.user.teacherId && teacherIdParam !== session.user.teacherId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      const teacher = await db.teacher.findFirst({
        where: {
          id: teacherIdParam,
          studioId: session.user.studioId,
        },
        select: { id: true },
      })

      if (!teacher) {
        return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
      }

      teacherIdFilter = teacher.id
    }

    const links = await db.socialMediaTrackingLink.findMany({
      where: {
        ...buildTrackingScope({
          studioId: session.user.studioId,
          teacherId: session.user.teacherId,
        }),
        ...(teacherIdFilter ? { teacherId: teacherIdFilter } : {}),
      },
      include: {
        account: true,
        flow: true,
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(links)
  } catch (error) {
    console.error("Failed to fetch tracking links:", error)
    return NextResponse.json({ error: "Failed to fetch tracking links" }, { status: 500 })
  }
}

// POST - Create new tracking link
export async function POST(request: NextRequest) {
  const session = await getSession()

  if (!session?.user?.studioId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { campaign, source, medium, content, flowId, accountId } = body

    // Generate tracking code
    const code = `sm_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`

    // Build destination URL (booking page with tracking)
    const studio = await db.studio.findUnique({
      where: { id: session.user.studioId }
    })

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    const destinationUrl = `${baseUrl}/${studio?.subdomain}`
    
    // Build full tracking URL with UTM params
    const params = new URLSearchParams({
      utm_source: source,
      utm_medium: medium,
      ...(campaign && { utm_campaign: campaign }),
      ...(content && { utm_content: content }),
      sf_track: code
    })
    
    const fullTrackingUrl = `${destinationUrl}?${params.toString()}`

    const link = await db.socialMediaTrackingLink.create({
      data: {
        code,
        campaign,
        source,
        medium,
        content,
        destinationUrl,
        fullTrackingUrl,
        flowId,
        accountId,
        studioId: session.user.studioId,
        teacherId: session.user.teacherId
      }
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error("Failed to create tracking link:", error)
    return NextResponse.json({ error: "Failed to create tracking link" }, { status: 500 })
  }
}















