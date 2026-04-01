import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'

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
          {tasks.map(task => (
            <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </SortableContext>
        {tasks.length === 0 && isOver && (
          <div className="schedule-drop-hint">Drop here</div>
        )}
      </div>
    </div>
  )
}
