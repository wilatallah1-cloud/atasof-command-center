import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import KanbanColumn from './KanbanColumn'

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete }) {
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const columns = {
    todo: tasks.filter(t => t.status === 'todo'),
    'in-progress': tasks.filter(t => t.status === 'in-progress'),
    done: tasks.filter(t => t.status === 'done'),
  }

  function handleDragStart(event) {
    const task = tasks.find(t => t.id === event.active.id)
    setActiveTask(task || null)
  }

  function handleDragEnd(event) {
    setActiveTask(null)
    const { active, over } = event
    if (!over) return

    const taskId = active.id
    // Determine target column: could be dropping on a column or on another card
    let targetStatus = over.id
    // If we dropped on a task card, find which column it belongs to
    if (!['todo', 'in-progress', 'done'].includes(targetStatus)) {
      const overTask = tasks.find(t => t.id === over.id)
      if (overTask) targetStatus = overTask.status
      else return
    }

    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== targetStatus) {
      onStatusChange(taskId, targetStatus)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban-board">
        <KanbanColumn status="todo" tasks={columns.todo} onEdit={onEdit} onDelete={onDelete} />
        <KanbanColumn status="in-progress" tasks={columns['in-progress']} onEdit={onEdit} onDelete={onDelete} />
        <KanbanColumn status="done" tasks={columns.done} onEdit={onEdit} onDelete={onDelete} />
      </div>
      <DragOverlay>
        {activeTask ? (
          <div className="kanban-card dragging" style={{ opacity: 0.85 }}>
            <div className="kanban-card-title">{activeTask.title}</div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
