import ClassFlowsAdminView from "@/components/studio/class-flows-admin-view"

export default function ClassFlowsPage() {
  return (
    <ClassFlowsAdminView
      adminEndpoint="/api/studio/class-flows/admin"
      contentEndpoint="/api/studio/class-flows/content"
      trainingRequestEndpoint="/api/class-flows/training-requests"
      uploadEndpoint="/api/upload"
      readOnly={false}
    />
  )
}
