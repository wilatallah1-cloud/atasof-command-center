import { useState } from 'react'

const ASSIGNEE_COLORS = {
  William: { bg: 'rgba(0,212,255,0.12)', color: '#00D4FF' },
  Dad:     { bg: 'rgba(255,180,0,0.12)', color: '#FFB400' },
  Both:    { bg: 'rgba(255,255,255,0.06)', color: '#888' },
}

export default function TaskList({ tasks, onToggle, onDelete, onUpdate, showDue = true }) {
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const sorted = [...tasks].sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0))

  function startEdit(task) {
    setEditingId(task.id)
    setEditText(task.title)
  }

  function saveEdit(id) {
    if (editText.trim() && onUpdate) onUpdate(id, { title: editText.trim() })
    setEditingId(null)
  }

  function cycleAssignee(task) {
    const order = ['Both', 'William', 'Dad']
    const current = task.assignee || 'Both'
    const next = order[(order.indexOf(current) + 1) % order.length]
    if (onUpdate) onUpdate(task.id, { assignee: next })
  }

  return (
    <div className="stack-sm">
      {sorted.map(task => {
        const assignee = task.assignee || 'Both'
        const style = ASSIGNEE_COLORS[assignee] || ASSIGNEE_COLORS.Both
        return (
          <div className="task-item" key={task.id}>
            <input
              type="checkbox"
              className="checkbox"
              checked={task.completed}
              onChange={() => onToggle(task.id)}
            />
            {editingId === task.id ? (
              <input
                className="input"
                value={editText}
                onChange={e => setEditText(e.target.value)}
                onBlur={() => saveEdit(task.id)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(task.id); if (e.key === 'Escape') setEditingId(null) }}
                autoFocus
                style={{ flex: 1, padding: '2px 6px', fontSize: 14 }}
              />
            ) : (
              <span
                className={`task-text${task.completed ? ' completed' : ''}`}
                onDoubleClick={() => startEdit(task)}
                title="Double-click to edit"
                style={{ cursor: 'text', flex: 1 }}
              >
                {task.title}
              </span>
            )}
            {showDue && task.dueDate && (
              <span className="task-due">{task.dueDate}</span>
            )}
            <button
              onClick={() => cycleAssignee(task)}
              title="Click to change assignee"
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                background: style.bg,
                color: style.color,
                letterSpacing: '0.03em',
                flexShrink: 0
              }}
            >
              {assignee}
            </button>
            {onDelete && (
              <button className="task-delete" onClick={() => onDelete(task.id)} title="Delete">×</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
