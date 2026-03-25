import { useState } from 'react'

export default function LogEntries({ entries, onDelete, onUpdate }) {
  const [editingIdx, setEditingIdx] = useState(null)
  const [editText, setEditText] = useState('')

  if (!entries || entries.length === 0) return <p className="small dim">No entries yet.</p>

  function startEdit(i) {
    setEditingIdx(i)
    setEditText(entries[i].text)
  }

  function saveEdit() {
    if (editText.trim() && onUpdate) {
      onUpdate(editingIdx, editText.trim())
    }
    setEditingIdx(null)
  }

  return (
    <div>
      {entries.map((entry, i) => (
        <div className="log-entry" key={i}>
          <span className="log-date">{entry.date}</span>
          {editingIdx === i ? (
            <input
              className="input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onBlur={saveEdit}
              onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingIdx(null) }}
              autoFocus
              style={{ flex: 1, padding: '2px 6px', fontSize: 13 }}
            />
          ) : (
            <span
              onDoubleClick={() => startEdit(i)}
              title="Double-click to edit"
              style={{ cursor: 'text', flex: 1 }}
            >
              {entry.text}
            </span>
          )}
          {onDelete && (
            <button className="task-delete" onClick={() => onDelete(i)} title="Delete">×</button>
          )}
        </div>
      ))}
    </div>
  )
}
