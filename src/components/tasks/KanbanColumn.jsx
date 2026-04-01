import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'

const COLUMN_META = {
  todo: { title: 'TO-DO', accent: '#00D4FF' },
  'in-progress': { title: 'IN PROGRESS', accent: '#FFD600' },
  done: { title: 'DONE', accent: '#00FF88' },
}

export default function KanbanColumn({ status, tasks, onEdit, onDelete }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = COLUMN_META[status]

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column${isOver ? ' drag-over' : ''}`}
    >
      <div className="kanban-column-header">
        <span className="kanban-column-title" style={{ color: meta.accent }}>
          {meta.title}
        </span>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </SortableContext>
    </div>
  )
}
