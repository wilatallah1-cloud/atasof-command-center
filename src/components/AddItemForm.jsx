import { useState } from 'react'

export function AddTaskForm({ onAdd, placeholder = 'Add a task...' }) {
  const [text, setText] = useState('')
  const [due, setDue] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd({
      id: `task-${Date.now()}`,
      title: text.trim(),
      completed: false,
      ...(due ? { dueDate: due } : {})
    })
    setText('')
    setDue('')
  }

  return (
    <form onSubmit={submit} className="add-form">
      <input
        className="input"
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ flex: 1 }}
      />
      <input
        type="date"
        className="input"
        value={due}
        onChange={e => setDue(e.target.value)}
        style={{ width: 140, fontSize: 12 }}
      />
      <button type="submit" className="btn btn-accent" disabled={!text.trim()}>Add</button>
    </form>
  )
}

export function AddNoteForm({ onAdd, placeholder = 'Add a note...' }) {
  const [text, setText] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    const today = new Date().toISOString().split('T')[0]
    onAdd({ date: today, text: text.trim() })
    setText('')
  }

  return (
    <form onSubmit={submit} className="add-form">
      <input
        className="input"
        placeholder={placeholder}
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn btn-accent" disabled={!text.trim()}>Add</button>
    </form>
  )
}

export function AddIdeaForm({ onAdd }) {
  const [text, setText] = useState('')
  const [project, setProject] = useState('Other')

  const projects = ['Outreach', 'Clients', 'AI Content SaaS', 'Coaching', 'YouTube', 'Other']

  function submit(e) {
    e.preventDefault()
    if (!text.trim()) return
    onAdd({
      id: `idea-${Date.now()}`,
      text: text.trim(),
      project,
      createdAt: new Date().toISOString()
    })
    setText('')
  }

  return (
    <form onSubmit={submit} className="add-form">
      <select className="select" value={project} onChange={e => setProject(e.target.value)}>
        {projects.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <input
        className="input"
        placeholder="Type an idea..."
        value={text}
        onChange={e => setText(e.target.value)}
        style={{ flex: 1 }}
      />
      <button type="submit" className="btn btn-accent" disabled={!text.trim()}>Add</button>
    </form>
  )
}
