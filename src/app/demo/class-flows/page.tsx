import ClassFlowsAdminView from "@/components/studio/class-flows-admin-view"

export default function DemoClassFlowsPage() {
  return <ClassFlowsAdminView adminEndpoint="/api/demo/class-flows/admin" readOnly />
}
