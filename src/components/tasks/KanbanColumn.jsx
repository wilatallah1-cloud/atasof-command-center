import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'

const COLUMN_META = {
  todo: { title: 'TO-DO', accent: '#00D4FF' },
  'in-progress': { title: 'IN PROGRESS', accent: '#FFD600' },
  done: { title: 'DONE', accent: '#00FF88' },
}

export default function KanbanColumn({ status, tasks, allTasks, onEdit, onDelete, onStatusChange }) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const meta = COLUMN_META[status]
  const [collapsed, setCollapsed] = useState({})

  // Separate parent tasks, subtasks, and standalone tasks
  const parentIds = new Set(allTasks.filter(t => t.parentId).map(t => t.parentId))
  const parents = tasks.filter(t => parentIds.has(t.id))
  const standalones = tasks.filter(t => !t.parentId && !parentIds.has(t.id))

  // Subtasks whose parent is NOT in this column (show them standalone)
  const orphanSubs = tasks.filter(t => t.parentId && !parents.find(p => p.id === t.parentId))

  // For drag context, we need all task IDs in this column
  const allIds = tasks.map(t => t.id)

  function toggleCollapse(parentId) {
    setCollapsed(c => ({ ...c, [parentId]: !c[parentId] }))
  }

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
      <SortableContext items={allIds} strategy={verticalListSortingStrategy}>
        {/* Parent groups */}
        {parents.map(parent => {
          const children = allTasks.filter(t => t.parentId === parent.id)
          const childrenInCol = children.filter(t => t.status === status)
          const doneCount = children.filter(t => t.status === 'done').length
          const isCollapsed = collapsed[parent.id]

          return (
            <div key={parent.id} className="kanban-parent-group">
              <div className="kanban-parent-header" onClick={() => toggleCollapse(parent.id)}>
                <span className="kanban-parent-arrow">{isCollapsed ? '▸' : '▾'}</span>
                <KanbanCard task={parent} onEdit={onEdit} onDelete={onDelete} isParent>
                  <span className="kanban-subtask-count">{doneCount}/{children.length}</span>
                </KanbanCard>
              </div>
              {!isCollapsed && childrenInCol.map(child => (
                <div key={child.id} className="kanban-subtask-indent">
                  <KanbanCard task={child} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </div>
          )
        })}

        {/* Standalone tasks (no parent, not a parent) */}
        {standalones.map(task => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} />
        ))}

        {/* Orphan subtasks (parent in different column) */}
        {orphanSubs.map(task => (
          <KanbanCard key={task.id} task={task} onEdit={onEdit} onDelete={onDelete} isOrphan />
        ))}
      </SortableContext>
    </div>
  )
}
