"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save } from "lucide-react"

type EngagementType = "CONTRACTOR" | "EMPLOYEE"

interface PayrollTeacher {
  id: string
  engagementType: EngagementType
  payrollAnnualSalary: number | null
  payrollHourlyRate: number | null
  payrollTaxRate: number | null
  user: {
    firstName: string
    lastName: string
    email: string
  }
}

export default function StudioEmployeesPayrollPage() {
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [moduleEnabled, setModuleEnabled] = useState(true)
  const [rows, setRows] = useState<PayrollTeacher[]>([])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch("/api/studio/employees/payroll")
        if (!active) return

        if (res.status === 403) {
          setModuleEnabled(false)
          return
        }

        if (!res.ok) {
          setRows([])
          return
        }

        const data = await res.json()
        setModuleEnabled(true)
        setRows(Array.isArray(data) ? data : [])
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const updateRow = (teacherId: string, patch: Partial<PayrollTeacher>) => {
    setRows((prev) =>
      prev.map((row) => (row.id === teacherId ? { ...row, ...patch } : row))
    )
  }

  const saveRow = async (row: PayrollTeacher) => {
    setSavingId(row.id)
    try {
      await fetch("/api/studio/employees/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId: row.id,
          engagementType: row.engagementType,
          payrollAnnualSalary: row.payrollAnnualSalary,
          payrollHourlyRate: row.payrollHourlyRate,
          payrollTaxRate: row.payrollTaxRate,
        }),
      })
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    )
  }

  if (!moduleEnabled) {
    return (
      <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen">
        <Card className="border-0 shadow-sm max-w-2xl">
          <CardContent className="p-6 space-y-3">
            <h1 className="text-xl font-semibold text-gray-900">Employees Module Disabled</h1>
            <p className="text-sm text-gray-600">
              Enable Employees in settings to access payroll settings.
            </p>
            <Link href="/studio/settings" className="text-sm font-medium text-violet-700 hover:text-violet-600">
              Open settings
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-5 lg:p-8 bg-gray-50/50 min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Employees • Payroll Settings</h1>
        <p className="text-gray-500 mt-1">
          Configure engagement type and payroll metadata. Full payroll engine is out-of-scope for this pass.
        </p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Teacher Payroll Profiles</CardTitle>
          <CardDescription>
            Use this as a setup/stub layer for compensation metadata and tax rates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row) => {
            const name = `${row.user.firstName} ${row.user.lastName}`
            return (
              <div key={row.id} className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{name}</p>
                    <p className="text-sm text-gray-500">{row.user.email}</p>
                  </div>
                  <Badge variant={row.engagementType === "EMPLOYEE" ? "default" : "secondary"}>
                    {row.engagementType}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>Engagement</Label>
                    <Select
                      value={row.engagementType}
                      onValueChange={(value) =>
                        updateRow(row.id, { engagementType: value as EngagementType })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Annual Salary</Label>
                    <Input
                      type="number"
                      value={row.payrollAnnualSalary ?? ""}
                      onChange={(event) =>
                        updateRow(row.id, {
                          payrollAnnualSalary:
                            event.target.value.trim() === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      value={row.payrollHourlyRate ?? ""}
                      onChange={(event) =>
                        updateRow(row.id, {
                          payrollHourlyRate:
                            event.target.value.trim() === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={row.payrollTaxRate ?? ""}
                      onChange={(event) =>
                        updateRow(row.id, {
                          payrollTaxRate:
                            event.target.value.trim() === "" ? null : Number(event.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => saveRow(row)}
                    disabled={savingId === row.id}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {savingId === row.id ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
