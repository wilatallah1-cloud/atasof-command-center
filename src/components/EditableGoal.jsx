import { useState } from 'react'

export function GoalCard({ goal, onUpdate, onDelete }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingCurrent, setEditingCurrent] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [current, setCurrent] = useState(String(goal.current))
  const [target, setTarget] = useState(String(goal.target))

  const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0

  function saveTitle() {
    setEditingTitle(false)
    if (title.trim() && title.trim() !== goal.title) onUpdate({ title: title.trim() })
  }
  function saveCurrent() {
    setEditingCurrent(false)
    const n = Number(current)
    if (!isNaN(n)) onUpdate({ current: n })
  }
  function saveTarget() {
    setEditingTarget(false)
    const n = Number(target)
    if (!isNaN(n) && n > 0) onUpdate({ target: n })
  }

  return (
    <div className="goal-card">
      <div className="goal-card-header">
        {editingTitle ? (
          <input className="input goal-title-input" value={title} onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(goal.title); setEditingTitle(false) } }}
            autoFocus />
        ) : (
          <span className="goal-title" onClick={() => setEditingTitle(true)}>{goal.title}</span>
        )}
        <div className="goal-numbers">
          {editingCurrent ? (
            <input type="number" className="input goal-num-input" value={current} onChange={e => setCurrent(e.target.value)}
              onBlur={saveCurrent} onKeyDown={e => { if (e.key === 'Enter') saveCurrent(); if (e.key === 'Escape') { setCurrent(String(goal.current)); setEditingCurrent(false) } }}
              autoFocus />
          ) : (
            <span className="goal-num clickable" onClick={() => { setCurrent(String(goal.current)); setEditingCurrent(true) }}>{goal.current}</span>
          )}
          <span className="goal-sep">/</span>
          {editingTarget ? (
            <input type="number" className="input goal-num-input" value={target} onChange={e => setTarget(e.target.value)}
              onBlur={saveTarget} onKeyDown={e => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') { setTarget(String(goal.target)); setEditingTarget(false) } }}
              autoFocus />
          ) : (
            <span className="goal-num clickable" onClick={() => { setTarget(String(goal.target)); setEditingTarget(true) }}>{goal.target}</span>
          )}
          <button className="task-delete" onClick={onDelete} title="Remove goal">×</button>
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function GoalList({ goals, path, setField }) {
  const [newTitle, setNewTitle] = useState('')
  const [newTarget, setNewTarget] = useState('')

  function addGoal(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    const updated = [...goals, {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      current: 0,
      target: Number(newTarget) || 1
    }]
    setField(path, updated)
    setNewTitle('')
    setNewTarget('')
  }

  function updateGoal(id, updates) {
    setField(path, goals.map(g => g.id === id ? { ...g, ...updates } : g))
  }

  function deleteGoal(id) {
    setField(path, goals.filter(g => g.id !== id))
  }

  return (
    <div>
      {goals.length > 0 && (
        <div className="stack-sm" style={{ marginBottom: 12 }}>
          {goals.map(g => (
            <GoalCard key={g.id} goal={g} onUpdate={u => updateGoal(g.id, u)} onDelete={() => deleteGoal(g.id)} />
          ))}
        </div>
      )}
      <form className="add-form" onSubmit={addGoal}>
        <input className="input" placeholder="New goal..." value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ flex: 1 }} />
        <input className="input" placeholder="Target" value={newTarget} onChange={e => setNewTarget(e.target.value)} style={{ width: 80, textAlign: 'center' }} />
        <button type="submit" className="btn btn-accent" disabled={!newTitle.trim()}>Add</button>
      </form>
    </div>
  )
}

export function SingleGoal({ goal, pathPrefix, setField }) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingCurrent, setEditingCurrent] = useState(false)
  const [editingTarget, setEditingTarget] = useState(false)
  const [title, setTitle] = useState(goal.title)
  const [current, setCurrent] = useState(String(goal.current))
  const [target, setTarget] = useState(String(goal.target))

  const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0

  function saveTitle() { setEditingTitle(false); if (title.trim()) setField(`${pathPrefix}.title`, title.trim()) }
  function saveCurrent() { setEditingCurrent(false); const n = Number(current); if (!isNaN(n)) setField(`${pathPrefix}.current`, n) }
  function saveTarget() { setEditingTarget(false); const n = Number(target); if (!isNaN(n) && n > 0) setField(`${pathPrefix}.target`, n) }

  return (
    <div>
      <div className="goal-card-header">
        {editingTitle ? (
          <input className="input goal-title-input" value={title} onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(goal.title); setEditingTitle(false) } }}
            autoFocus />
        ) : (
          <span className="goal-title" onClick={() => { setTitle(goal.title); setEditingTitle(true) }}>{goal.title}</span>
        )}
        <div className="goal-numbers">
          {editingCurrent ? (
            <input type="number" className="input goal-num-input" value={current} onChange={e => setCurrent(e.target.value)}
              onBlur={saveCurrent} onKeyDown={e => { if (e.key === 'Enter') saveCurrent(); if (e.key === 'Escape') { setCurrent(String(goal.current)); setEditingCurrent(false) } }}
              autoFocus />
          ) : (
            <span className="goal-num clickable" onClick={() => { setCurrent(String(goal.current)); setEditingCurrent(true) }}>{goal.current}</span>
          )}
          <span className="goal-sep">/</span>
          {editingTarget ? (
            <input type="number" className="input goal-num-input" value={target} onChange={e => setTarget(e.target.value)}
              onBlur={saveTarget} onKeyDown={e => { if (e.key === 'Enter') saveTarget(); if (e.key === 'Escape') { setTarget(String(goal.target)); setEditingTarget(false) } }}
              autoFocus />
          ) : (
            <span className="goal-num clickable" onClick={() => { setTarget(String(goal.target)); setEditingTarget(true) }}>{goal.target}</span>
          )}
        </div>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
