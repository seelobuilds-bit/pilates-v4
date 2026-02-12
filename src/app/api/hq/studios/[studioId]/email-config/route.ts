import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { createDomain, checkDomainStatus, verifyDomain, deleteDomain } from "@/lib/email"
import { Prisma } from "@prisma/client"

function toJsonField(value: unknown): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput {
  return value === null || value === undefined
    ? Prisma.JsonNull
    : (value as Prisma.InputJsonValue)
}

// GET - Fetch studio email config (HQ admin)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params

    const studio = await db.studio.findUnique({
      where: { id: studioId },
      include: { emailConfig: true }
    })

    if (!studio) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    return NextResponse.json({ 
      config: studio.emailConfig,
      studioName: studio.name,
      subdomain: studio.subdomain
    })
  } catch (error) {
    console.error("Error fetching email config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create/Update email config and start domain verification (HQ admin)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params
    const body = await request.json()
    const { fromName, fromEmail, replyToEmail, domain } = body

    if (!fromName) {
      return NextResponse.json({ error: "From name is required" }, { status: 400 })
    }

    // Check if config exists
    const existingConfig = await db.studioEmailConfig.findUnique({
      where: { studioId }
    })

    // If domain changed and old domain exists, delete it from Resend
    if (existingConfig?.resendDomainId && existingConfig.domain !== domain) {
      await deleteDomain(existingConfig.resendDomainId)
    }

    let domainData = null
    let dnsRecords = null
    let domainStatus = "not_started"
    let resendDomainId = null

    // If domain provided, create it in Resend
    if (domain) {
      const result = await createDomain(domain)
      if (result.success) {
        resendDomainId = result.domainId
        domainStatus = result.status || "pending"
        dnsRecords = result.records
        domainData = {
          domain,
          resendDomainId,
          domainStatus,
          dnsRecords
        }
      } else {
        return NextResponse.json({ error: result.error || "Failed to create domain" }, { status: 400 })
      }
    }

    // Upsert the config
    const config = await db.studioEmailConfig.upsert({
      where: { studioId },
      update: {
        fromName,
        fromEmail: fromEmail || null,
        replyToEmail: replyToEmail || null,
        ...(domainData && {
          domain: domainData.domain,
          resendDomainId: domainData.resendDomainId,
          domainStatus: domainData.domainStatus,
          dnsRecords: toJsonField(domainData.dnsRecords)
        })
      },
      create: {
        studioId,
        fromName,
        fromEmail: fromEmail || null,
        replyToEmail: replyToEmail || null,
        domain: domainData?.domain || null,
        resendDomainId: domainData?.resendDomainId || null,
        domainStatus: domainData?.domainStatus || "not_started",
        dnsRecords: toJsonField(domainData?.dnsRecords)
      }
    })

    return NextResponse.json({ 
      config,
      message: domain ? "Domain verification started. Add the DNS records below." : "Email settings saved."
    })
  } catch (error) {
    console.error("Error updating email config:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH - Check domain verification status or trigger verification (HQ admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ studioId: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user || session.user.role !== "HQ_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { studioId } = await params
    const body = await request.json()
    const { action } = body // "check" or "verify"

    const config = await db.studioEmailConfig.findUnique({
      where: { studioId }
    })

    if (!config || !config.resendDomainId) {
      return NextResponse.json({ error: "No domain configured" }, { status: 400 })
    }

    let result
    if (action === "verify") {
      // Trigger verification check
      result = await verifyDomain(config.resendDomainId)
    } else {
      // Just check status
      result = await checkDomainStatus(config.resendDomainId)
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Update local status
    const updatedConfig = await db.studioEmailConfig.update({
      where: { studioId },
      data: {
        domainStatus: result.status || config.domainStatus,
        dnsRecords: result.records
          ? toJsonField(result.records)
          : toJsonField(config.dnsRecords),
        verifiedAt: result.status === "verified" ? new Date() : null
      }
    })

    return NextResponse.json({ 
      config: updatedConfig,
      status: result.status,
      records: result.records
    })
  } catch (error) {
    console.error("Error checking domain status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
