import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const SECTION_COLORS = {
  dashboard: '#888',
  outreach: '#00D4FF',
  clients: '#FF8A00',
  'ai-app': '#FFD600',
  coaching: '#00FF88',
  content: '#FF4D6A',
}

const ASSIGNEE_COLORS = {
  William: '#00D4FF',
  Fadi: '#FFB400',
  Both: '#888',
}

const PRIORITY_LABELS = {
  high: { text: 'HIGH', color: '#FF4D6A' },
  normal: null,
  low: { text: 'LOW', color: '#888' },
}

export default function KanbanCard({ task, onEdit, onDelete, isParent, isOrphan, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'task', task } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const sectionColor = SECTION_COLORS[task.section] || '#888'
  const assigneeColor = ASSIGNEE_COLORS[task.assignee] || '#888'
  const priority = PRIORITY_LABELS[task.priority]

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kanban-card${isDragging ? ' dragging' : ''}${isParent ? ' is-parent' : ''}${isOrphan ? ' is-subtask' : ''}`}
      onDoubleClick={() => onEdit?.(task)}
    >
      <div className="kanban-card-title">{task.title}</div>
      <div className="kanban-card-meta">
        <span className="source-badge" style={{ background: `${sectionColor}18`, color: sectionColor }}>
          {task.section}
        </span>
        <span className="source-badge" style={{ background: `${assigneeColor}18`, color: assigneeColor }}>
          {task.assignee}
        </span>
        {priority && (
          <span className="source-badge" style={{ background: `${priority.color}18`, color: priority.color }}>
            {priority.text}
          </span>
        )}
        {task.scheduledTime && (
          <span className="source-badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#888' }}>
            {task.scheduledTime}
          </span>
        )}
        {children}
      </div>
      <button
        className="kanban-card-delete"
        onClick={(e) => { e.stopPropagation(); onDelete?.(task.id) }}
        title="Delete task"
      >×</button>
    </div>
  )
}
