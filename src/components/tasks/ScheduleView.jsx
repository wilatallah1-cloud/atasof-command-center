import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ScheduleSlot from './ScheduleSlot'
import KanbanCard from './KanbanCard'

function generateTimeSlots(start, end) {
  const slots = []
  const [startH] = start.split(':').map(Number)
  const [endH] = end.split(':').map(Number)
  for (let h = startH; h < endH; h++) {
    const time = `${String(h).padStart(2, '0')}:00`
    const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`
    slots.push({ time, label })
  }
  return slots
}

function isPeakHour(time, peakStart, peakEnd) {
  return time >= peakStart && time < peakEnd
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

function getTasksForSlot(tasks, slotTime) {
  const slotStart = timeToMinutes(slotTime)
  const slotEnd = slotStart + 60
  return tasks.filter(t => {
    if (!t.scheduledTime) return false
    const taskStart = timeToMinutes(t.scheduledTime)
    const taskEnd = taskStart + (t.duration || 60)
    // Task overlaps this slot if it starts before slot ends and ends after slot starts
    return taskStart < slotEnd && taskEnd > slotStart
  })
}

function isFirstSlotForTask(task, slotTime) {
  if (!task.scheduledTime) return false
  const taskH = parseInt(task.scheduledTime.split(':')[0])
  const slotH = parseInt(slotTime.split(':')[0])
  return taskH === slotH
}

export default function ScheduleView({ tasks, settings, onSchedule, onStatusChange, onEdit, onDelete }) {
  const [activeTask, setActiveTask] = useState(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const slots = generateTimeSlots(settings.workStart, settings.workEnd)
  const unscheduled = tasks.filter(t => !t.scheduledTime && t.status !== 'done')
  const allTaskIds = tasks.map(t => t.id)

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  function handleDragEnd(event) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id
    const overId = String(over.id)

    // Dropping on a schedule slot
    if (overId.startsWith('schedule-')) {
      const time = overId.replace('schedule-', '')
      onSchedule(taskId, time)
      return
    }

    // Dropping on the unscheduled zone
    if (overId === 'unscheduled') {
      onSchedule(taskId, null)
      return
    }

    // Dropping on another task — schedule to same slot
    const overTask = tasks.find(t => t.id === overId)
    if (overTask && overTask.scheduledTime) {
      onSchedule(taskId, overTask.scheduledTime)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="schedule-grid">
        {slots.map(slot => (
          <ScheduleSlot
            key={slot.time}
            time={slot.time}
            label={slot.label}
            isPeak={isPeakHour(slot.time, settings.peakStart, settings.peakEnd)}
            tasks={getTasksForSlot(tasks, slot.time)}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>

      {unscheduled.length > 0 && (
        <UnscheduledZone tasks={unscheduled} onEdit={onEdit} onDelete={onDelete} />
      )}

      <DragOverlay>
        {activeTask ? (
          <div className="kanban-card dragging" style={{ opacity: 0.85, maxWidth: 280 }}>
            <div className="kanban-card-title">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function UnscheduledZone({ tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'unscheduled' })

  return (
    <div ref={setNodeRef} className={`schedule-unscheduled${isOver ? ' drag-over' : ''}`}>
      <div className="kanban-column-header" style={{ marginBottom: 10 }}>
        <span className="kanban-column-title">UNSCHEDULED</span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <div className="schedule-unscheduled-grid">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}
