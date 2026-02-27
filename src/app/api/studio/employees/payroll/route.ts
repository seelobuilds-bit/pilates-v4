import { NextRequest, NextResponse } from "next/server"
import { TeacherEngagementType } from "@prisma/client"
import { z } from "zod"
import { db } from "@/lib/db"
import { requireOwnerStudioAccess } from "@/lib/owner-auth"
import { getStudioModuleAccess } from "@/modules/employees/module-access"

const updatePayrollSchema = z.object({
  teacherId: z.string().min(1),
  engagementType: z.nativeEnum(TeacherEngagementType),
  payrollAnnualSalary: z.number().nullable().optional(),
  payrollHourlyRate: z.number().nullable().optional(),
  payrollTaxRate: z.number().nullable().optional(),
})

export async function GET() {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  const modules = await getStudioModuleAccess(auth.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  try {
    const teachers = await db.teacher.findMany({
      where: { studioId: auth.studioId },
      select: {
        id: true,
        engagementType: true,
        payrollAnnualSalary: true,
        payrollHourlyRate: true,
        payrollTaxRate: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ user: { firstName: "asc" } }, { user: { lastName: "asc" } }],
    })

    return NextResponse.json(teachers)
  } catch (error) {
    console.error("Failed to fetch payroll settings:", error)
    return NextResponse.json({ error: "Failed to fetch payroll settings" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireOwnerStudioAccess()

  if ("error" in auth) {
    return auth.error
  }

  const modules = await getStudioModuleAccess(auth.studioId)
  if (!modules.employeesEnabled) {
    return NextResponse.json({ error: "Employees module is disabled for this studio" }, { status: 403 })
  }

  try {
    const parsed = updatePayrollSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 })
    }

    const updated = await db.teacher.updateMany({
      where: {
        id: parsed.data.teacherId,
        studioId: auth.studioId,
      },
      data: {
        engagementType: parsed.data.engagementType,
        payrollAnnualSalary: parsed.data.payrollAnnualSalary ?? null,
        payrollHourlyRate: parsed.data.payrollHourlyRate ?? null,
        payrollTaxRate: parsed.data.payrollTaxRate ?? null,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 })
    }

    const teacher = await db.teacher.findUnique({
      where: { id: parsed.data.teacherId },
      select: {
        id: true,
        engagementType: true,
        payrollAnnualSalary: true,
        payrollHourlyRate: true,
        payrollTaxRate: true,
      },
    })

    return NextResponse.json(teacher)
  } catch (error) {
    console.error("Failed to update payroll settings:", error)
    return NextResponse.json({ error: "Failed to update payroll settings" }, { status: 500 })
  }
}
