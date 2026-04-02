import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'

function isFirstSlot(task, slotTime) {
  if (!task.scheduledTime) return false
  return parseInt(task.scheduledTime.split(':')[0]) === parseInt(slotTime.split(':')[0])
}

export default function ScheduleSlot({ time, label, isPeak, tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: `schedule-${time}` })

  return (
    <div
      ref={setNodeRef}
      className={`schedule-slot${isPeak ? ' peak' : ''}${isOver ? ' drag-over' : ''}`}
    >
      <div className="schedule-time">
        {label}
        {isPeak && <span className="peak-label">PEAK</span>}
      </div>
      <div className="schedule-tasks">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map(task => {
            const first = isFirstSlot(task, time)
            if (!first) {
              // Continuation — show a slim bar instead of the full card
              return (
                <div key={task.id} className="schedule-continuation" onDoubleClick={() => onEdit?.(task)}>
                  <span className="schedule-continuation-title">↕ {task.title}</span>
                </div>
              )
            }
            return (
              <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete}>
                {task.duration > 60 && (
                  <span className="source-badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}>
                    {task.duration}m
                  </span>
                )}
              </KanbanCard>
            )
          })}
        </SortableContext>
        {tasks.length === 0 && isOver && (
          <div className="schedule-drop-hint">Drop here</div>
        )}
      </div>
    </div>
  )
}
