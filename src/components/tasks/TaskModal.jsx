import { useState, useEffect } from 'react'

const SECTIONS = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'clients', label: 'Clients' },
  { value: 'ai-app', label: 'AI App' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'content', label: 'Content' },
]

export default function TaskModal({ task, onSave, onClose, clients }) {
  const [form, setForm] = useState({
    title: '',
    section: 'dashboard',
    sectionRefId: '',
    assignee: 'William',
    priority: 'normal',
    dueDate: '',
    scheduledTime: '',
    duration: 60,
    status: 'todo',
  })

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title || '',
        section: task.section || 'dashboard',
        sectionRefId: task.sectionRefId || '',
        assignee: task.assignee || 'William',
        priority: task.priority || 'normal',
        dueDate: task.dueDate || '',
        scheduledTime: task.scheduledTime || '',
        duration: task.duration || 60,
        status: task.status || 'todo',
      })
    }
  }, [task])

  if (!task) return null

  function handleSubmit(e) {
    e.preventDefault()
    onSave(task.id, {
      ...form,
      sectionRefId: form.section === 'clients' ? (form.sectionRefId || null) : null,
      scheduledTime: form.scheduledTime || null,
      completedAt: form.status === 'done' && task.status !== 'done'
        ? new Date().toISOString()
        : (form.status !== 'done' ? null : task.completedAt),
    })
    onClose()
  }

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={e => e.stopPropagation()}>
        <h3 style={{ marginBottom: 16, fontSize: 15, fontWeight: 600 }}>Edit Task</h3>
        <form onSubmit={handleSubmit} className="stack">
          <label className="form-label">
            Title
            <input className="input" value={form.title} onChange={set('title')} autoFocus />
          </label>
          <div className="row" style={{ gap: 12 }}>
            <label className="form-label" style={{ flex: 1 }}>
              Section
              <select className="select" value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value, sectionRefId: '' }))}>
                {SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label className="form-label" style={{ flex: 1 }}>
              Assignee
              <select className="select" value={form.assignee} onChange={set('assignee')}>
                <option value="William">William</option>
                <option value="Fadi">Fadi</option>
                <option value="Both">Both</option>
              </select>
            </label>
          </div>
          {form.section === 'clients' && clients?.length > 0 && (
            <label className="form-label">
              Client
              <select className="select" value={form.sectionRefId} onChange={set('sectionRefId')}>
                <option value="">Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          <div className="row" style={{ gap: 12 }}>
            <label className="form-label" style={{ flex: 1 }}>
              Priority
              <select className="select" value={form.priority} onChange={set('priority')}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="form-label" style={{ flex: 1 }}>
              Status
              <select className="select" value={form.status} onChange={set('status')}>
                <option value="todo">To-Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </label>
          </div>
          <div className="row" style={{ gap: 12 }}>
            <label className="form-label" style={{ flex: 1 }}>
              Due Date
              <input type="date" className="input" value={form.dueDate} onChange={set('dueDate')} />
            </label>
            <label className="form-label" style={{ flex: 1 }}>
              Scheduled Time
              <input type="time" className="input" value={form.scheduledTime} onChange={set('scheduledTime')} />
            </label>
          </div>
          <label className="form-label">
            Duration (minutes)
            <input type="number" className="input" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: parseInt(e.target.value) || 60 }))} min={15} step={15} />
          </label>
          <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-accent">Save</button>
          </div>
        </form>
      </div>
    </div>
  )
}
