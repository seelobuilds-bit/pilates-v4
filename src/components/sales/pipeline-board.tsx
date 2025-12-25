"use client"

import { useState } from "react"
import Link from "next/link"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
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
  } = useSortable({ id: lead.id })

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
  isOver,
}: {
  stage: PipelineStage
  leads: Lead[]
  formatCurrency: (value: number | null) => string
  formatDate: (date: string) => string
  getPriorityColor: (priority: string) => string
  basePath: string
  isOver: boolean
}) {
  const stageValue = leads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0)

  return (
    <div className="flex-shrink-0 w-72">
      <div className={`h-2 ${stage.color} rounded-t-lg`} />
      <Card className={`rounded-t-none border-t-0 transition-colors ${isOver ? "bg-violet-50 border-violet-300" : ""}`}>
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{stage.label}</CardTitle>
            <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
          </div>
          <p className="text-xs text-gray-500">{formatCurrency(stageValue)}</p>
        </CardHeader>
        <CardContent className="p-2 space-y-2 max-h-[400px] overflow-y-auto min-h-[100px]">
          <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
            {leads.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">
                {isOver ? "Drop here!" : "No leads"}
              </p>
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
  const [overId, setOverId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: { over: { id: string } | null }) => {
    setOverId(event.over?.id as string || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setOverId(null)

    if (!over) return

    const leadId = active.id as string
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    // Check if dropped on a column (stage)
    const targetStage = stages.find(s => s.value === over.id)
    if (targetStage && lead.status !== targetStage.value) {
      await onLeadMove(leadId, targetStage.value)
      return
    }

    // Check if dropped on another lead - use that lead's status
    const targetLead = leads.find(l => l.id === over.id)
    if (targetLead && lead.status !== targetLead.status) {
      await onLeadMove(leadId, targetLead.status)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Renders columns inline - parent should be flex container */}
      {stages.map(stage => {
        const stageLeads = leads.filter(l => l.status === stage.value)
        return (
          <SortableContext key={stage.value} id={stage.value} items={[stage.value]}>
            <DroppableColumn
              stage={stage}
              leads={stageLeads}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getPriorityColor={getPriorityColor}
              basePath={basePath}
              isOver={overId === stage.value || stageLeads.some(l => l.id === overId)}
            />
          </SortableContext>
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
