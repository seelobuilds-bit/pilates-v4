"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDroppable,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GripVertical } from "lucide-react"

interface Lead {
  id: string
  studioName: string
  contactName: string
  status: string
  priority: string
  estimatedValue: number | null
  createdAt: string
  assignedTo: {
    user: {
      firstName: string
      lastName: string
    }
  } | null
}

interface PipelineStage {
  value: string
  label: string
  color: string
}

interface PipelineBoardProps {
  leads: Lead[]
  stages: PipelineStage[]
  onLeadMove: (leadId: string, newStatus: string) => Promise<void>
  formatCurrency: (value: number | null) => string
  formatDate: (date: string) => string
  getPriorityColor: (priority: string) => string
  basePath: string
}

// Draggable Lead Card
function DraggableLeadCard({
  lead,
  formatCurrency,
  formatDate,
  getPriorityColor,
  basePath,
  isDragging = false,
}: {
  lead: Lead
  formatCurrency: (value: number | null) => string
  formatDate: (date: string) => string
  getPriorityColor: (priority: string) => string
  basePath: string
  isDragging?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lead.id, data: { type: "lead", status: lead.status } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 bg-white border rounded-lg hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? "shadow-lg ring-2 ring-violet-400" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Link href={`${basePath}/${lead.id}`} className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate">{lead.studioName}</p>
              <p className="text-xs text-gray-500 truncate">{lead.contactName}</p>
            </div>
            <Badge className={`text-xs ml-2 flex-shrink-0 ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </Badge>
          </div>
          {lead.estimatedValue && (
            <p className="text-sm font-semibold text-green-600 mt-2">{formatCurrency(lead.estimatedValue)}</p>
          )}
          <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
            {lead.assignedTo ? (
              <span>{lead.assignedTo.user.firstName} {lead.assignedTo.user.lastName[0]}.</span>
            ) : (
              <span className="text-orange-500">Unassigned</span>
            )}
            <span>{formatDate(lead.createdAt)}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

// Lead Card for Drag Overlay
function LeadCardOverlay({
  lead,
  formatCurrency,
  getPriorityColor,
}: {
  lead: Lead
  formatCurrency: (value: number | null) => string
  getPriorityColor: (priority: string) => string
}) {
  return (
    <div className="p-3 bg-white border rounded-lg shadow-xl ring-2 ring-violet-500 w-64">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm truncate">{lead.studioName}</p>
          <p className="text-xs text-gray-500 truncate">{lead.contactName}</p>
        </div>
        <Badge className={`text-xs ml-2 ${getPriorityColor(lead.priority)}`}>
          {lead.priority}
        </Badge>
      </div>
      {lead.estimatedValue && (
        <p className="text-sm font-semibold text-green-600 mt-2">{formatCurrency(lead.estimatedValue)}</p>
      )}
    </div>
  )
}

// Droppable Column
function DroppableColumn({
  stage,
  leads,
  formatCurrency,
  formatDate,
  getPriorityColor,
  basePath,
}: {
  stage: PipelineStage
  leads: Lead[]
  formatCurrency: (value: number | null) => string
  formatDate: (date: string) => string
  getPriorityColor: (priority: string) => string
  basePath: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.value,
    data: { type: "column", status: stage.value }
  })

  const stageValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`h-2 ${stage.color} rounded-t-lg`} />
      <Card 
        ref={setNodeRef}
        className={`rounded-t-none border-t-0 transition-colors min-h-[450px] ${
          isOver ? "bg-violet-50 border-violet-300 ring-2 ring-violet-400" : ""
        }`}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
            <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
          </div>
          <p className="text-xs text-gray-500">{formatCurrency(stageValue)}</p>
        </CardHeader>
        <CardContent className="p-2 space-y-2 max-h-[400px] overflow-y-auto">
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {leads.length === 0 ? (
              <div className={`text-xs text-center py-8 rounded-lg border-2 border-dashed ${
                isOver ? "border-violet-400 bg-violet-100 text-violet-600" : "border-gray-200 text-gray-400"
              }`}>
                {isOver ? "Drop here!" : "No leads in this stage"}
              </div>
            ) : (
              leads.map(lead => (
                <DraggableLeadCard
                  key={lead.id}
                  lead={lead}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  getPriorityColor={getPriorityColor}
                  basePath={basePath}
                />
              ))
            )}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  )
}

// Main Pipeline Board
export function PipelineBoard({
  leads,
  stages,
  onLeadMove,
  formatCurrency,
  formatDate,
  getPriorityColor,
  basePath,
}: PipelineBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const leadId = active.id as string
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    // Get the target status from the over element
    let targetStatus: string | null = null

    // Check if dropped on a column
    if (over.data?.current?.type === "column") {
      targetStatus = over.data.current.status
    }
    // Check if dropped on another lead - use that lead's status
    else {
      const targetLead = leads.find(l => l.id === over.id)
      if (targetLead) {
        targetStatus = targetLead.status
      }
    }

    // If we found a target status and it's different, move the lead
    if (targetStatus && lead.status !== targetStatus) {
      console.log(`Moving lead ${leadId} from ${lead.status} to ${targetStatus}`)
      await onLeadMove(leadId, targetStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {stages.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage.value)
        return (
          <DroppableColumn
            key={stage.value}
            stage={stage}
            leads={stageLeads}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
            getPriorityColor={getPriorityColor}
            basePath={basePath}
          />
        )
      })}

      <DragOverlay>
        {activeLead ? (
          <LeadCardOverlay
            lead={activeLead}
            formatCurrency={formatCurrency}
            getPriorityColor={getPriorityColor}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}













