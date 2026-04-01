import { useState } from 'react'
import { useData } from '../context/DataContext'
import { AddIdeaForm } from '../components/AddItemForm'

const PROJECT_TO_SECTION = {
  'Outreach': 'outreach',
  'Clients': 'clients',
  'AI Content SaaS': 'ai-app',
  'Coaching': 'coaching',
  'YouTube': 'content',
  'Other': 'dashboard',
}

export default function Ideas() {
  const { data, setField, addToArray, removeFromArray, updateInArray } = useData()
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [filterProject, setFilterProject] = useState('All')
  const [turnedIds, setTurnedIds] = useState(new Set())

  const projects = ['All', 'Outreach', 'Clients', 'AI Content SaaS', 'Coaching', 'YouTube', 'Other']

  const sorted = [...data.ideas]
    .filter(i => filterProject === 'All' || i.project === filterProject)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  function turnIntoTask(idea) {
    const section = PROJECT_TO_SECTION[idea.project] || 'dashboard'
    let sectionRefId = null
    if (section === 'ai-app') {
      sectionRefId = String(data.aiSaas.currentPhase)
    }

    // YouTube ideas go to the content pipeline instead
    if (idea.project === 'YouTube') {
      setField('youtube.pipeline.ideas', [...data.youtube.pipeline.ideas, { id: `yt-${Date.now()}`, title: idea.text }])
    } else {
      addToArray('tasks', {
        id: `task-${Date.now()}`,
        title: idea.text,
        status: 'todo',
        assignee: 'William',
        section,
        sectionRefId,
        dueDate: new Date().toISOString().split('T')[0],
        scheduledTime: null,
        duration: 60,
        priority: 'normal',
        createdAt: new Date().toISOString(),
        completedAt: null,
      })
    }

    setTurnedIds(prev => new Set([...prev, idea.id]))
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function startEdit(idea) {
    setEditingId(idea.id)
    setEditText(idea.text)
  }

  function saveEdit(id) {
    if (editText.trim()) updateInArray('ideas', id, { text: editText.trim() })
    setEditingId(null)
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>Ideas / Brain Dump</h1>
        <p className="section-desc">Capture fast, tag by project, turn into tasks later.</p>
      </div>

      <div className="card">
        <AddIdeaForm onAdd={idea => setField('ideas', [idea, ...data.ideas])} />
      </div>

      {data.ideas.length > 0 && (
        <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {projects.map(p => (
            <button key={p} className={`nav-pill${filterProject === p ? ' active' : ''}`}
              onClick={() => setFilterProject(p)} style={{ fontSize: 12, padding: '4px 10px' }}>
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="stack">
        {sorted.map(idea => (
          <div className="card idea-card" key={idea.id}>
            <div style={{ flex: 1 }}>
              <div className="row" style={{ gap: 8, marginBottom: 6 }}>
                <select className="select" value={idea.project}
                  onChange={e => updateInArray('ideas', idea.id, { project: e.target.value })}
                  style={{ fontSize: 10, padding: '2px 6px' }}>
                  {projects.filter(p => p !== 'All').map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <span className="mono small dim">{formatDate(idea.createdAt)}</span>
              </div>
              {editingId === idea.id ? (
                <textarea className="input" value={editText} onChange={e => setEditText(e.target.value)}
                  onBlur={() => saveEdit(idea.id)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(idea.id) }; if (e.key === 'Escape') setEditingId(null) }}
                  autoFocus style={{ fontSize: 14, minHeight: 60 }} />
              ) : (
                <p style={{ fontSize: 14, lineHeight: 1.6, cursor: 'text' }} onDoubleClick={() => startEdit(idea)} title="Double-click to edit">
                  {idea.text}
                </p>
              )}
            </div>
            <div className="stack-sm" style={{ gap: 4, alignItems: 'flex-end' }}>
              {turnedIds.has(idea.id) ? (
                <span className="small" style={{ color: 'var(--green)', fontWeight: 600 }}>Added!</span>
              ) : (
                <button className="btn btn-ghost" onClick={() => turnIntoTask(idea)}>Turn into task</button>
              )}
              <button className="task-delete" onClick={() => removeFromArray('ideas', idea.id)}>x</button>
            </div>
          </div>
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p className="muted">{data.ideas.length === 0 ? 'No ideas yet. Add one above.' : `No ideas in ${filterProject}.`}</p>
        </div>
      )}
    </div>
  )
}
