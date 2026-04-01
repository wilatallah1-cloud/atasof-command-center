import { useState } from 'react'

const SECTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'clients', label: 'Clients' },
  { value: 'ai-app', label: 'AI App' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'content', label: 'Content' },
]

export default function AddTaskBar({ onAdd, defaultSection, defaultDate, clients }) {
  const [title, setTitle] = useState('')
  const [section, setSection] = useState(defaultSection || 'dashboard')
  const [clientId, setClientId] = useState('')
  const [assignee, setAssignee] = useState('William')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState(defaultDate || new Date().toISOString().split('T')[0])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    if (section === 'clients' && !clientId && clients?.length > 0) return
    onAdd({
      id: `task-${Date.now()}`,
      title: title.trim(),
      status: 'todo',
      assignee,
      section,
      sectionRefId: section === 'clients' ? clientId : null,
      dueDate: dueDate || null,
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
      <select className="select" value={section} onChange={e => { setSection(e.target.value); setClientId('') }}>
        {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
      {section === 'clients' && clients?.length > 0 && (
        <select className="select" value={clientId} onChange={e => setClientId(e.target.value)}>
          <option value="">Select client...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
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
