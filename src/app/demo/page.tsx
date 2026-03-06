import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function DemoDashboardPage() {
  redirect("/demo/access?next=/studio")
}
