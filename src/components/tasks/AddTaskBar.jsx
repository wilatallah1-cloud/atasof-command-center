import { useState } from 'react'

const SECTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'clients', label: 'Clients' },
  { value: 'ai-app', label: 'AI App' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'content', label: 'Content' },
]

export default function AddTaskBar({ onAdd, defaultSection, defaultDate }) {
  const [title, setTitle] = useState('')
  const [section, setSection] = useState(defaultSection || 'dashboard')
  const [assignee, setAssignee] = useState('William')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState(defaultDate || new Date().toISOString().split('T')[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      id: `task-${Date.now()}`,
      title: title.trim(),
      status: 'todo',
      assignee,
      section,
      sectionRefId: null,
      dueDate,
      scheduledTime: null,
      duration: 60,
      priority,
      createdAt: new Date().toISOString(),
      completedAt: null,
    })
    setTitle('')
  }

  return (
    <form className="add-task-bar" onSubmit={handleSubmit}>
      <input
        className="input"
        placeholder="Add a task..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{ flex: 1 }}
      />
      <select className="select" value={section} onChange={e => setSection(e.target.value)}>
        {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      <select className="select" value={assignee} onChange={e => setAssignee(e.target.value)}>
        <option value="William">William</option>
        <option value="Fadi">Fadi</option>
        <option value="Both">Both</option>
      </select>
      <select className="select" value={priority} onChange={e => setPriority(e.target.value)}>
        <option value="low">Low</option>
        <option value="normal">Normal</option>
        <option value="high">High</option>
      </select>
      <input
        type="date"
        className="input"
        value={dueDate}
        onChange={e => setDueDate(e.target.value)}
        style={{ width: 140 }}
      />
      <button type="submit" className="btn btn-accent">Add</button>
    </form>
  )
}
