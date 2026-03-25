import { useState } from 'react'

export default function TaskList({ tasks, onToggle, onDelete, onUpdate, showDue = true }) {
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')

  const sorted = [...tasks].sort((a, b) => (a.completed ? 1 : 0) - (b.completed ? 1 : 0))

  function startEdit(task) {
    setEditingId(task.id)
    setEditText(task.title)
  }

  function saveEdit(id) {
    if (editText.trim() && onUpdate) {
      onUpdate(id, { title: editText.trim() })
    }
    setEditingId(null)
  }

  return (
    <div className="stack-sm">
      {sorted.map(task => (
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
          {onDelete && (
            <button
              className="task-delete"
              onClick={() => onDelete(task.id)}
              title="Delete"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
