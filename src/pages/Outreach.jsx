import { useState } from 'react'
import { useData } from '../context/DataContext'
import TaskList from '../components/TaskList'
import LogEntries from '../components/LogEntries'
import { AddTaskForm, AddNoteForm } from '../components/AddItemForm'
import { InlineNumberEdit } from '../components/InlineEdit'
import { GoalList } from '../components/EditableGoal'
import NotionLinks from '../components/NotionLinks'

export default function Outreach() {
  const { data, setField, addToArray, removeFromArray, updateInArray, toggleTask } = useData()
  const d = data.outreach
  const p = d.pipeline

  const steps = [
    { label: 'Leads', key: 'leads', value: p.leads },
    { label: 'Contacted', key: 'contacted', value: p.contacted },
    { label: 'Replied', key: 'replied', value: p.replied },
    { label: 'Meetings', key: 'meetingsBooked', value: p.meetingsBooked },
    { label: 'Closed', key: 'closed', value: p.closed },
  ]

  const [newStatusLabel, setNewStatusLabel] = useState('')
  const [newStatusOptions, setNewStatusOptions] = useState('')

  function addStatus(e) {
    e.preventDefault()
    if (!newStatusLabel.trim()) return
    const opts = newStatusOptions.trim()
      ? newStatusOptions.split(',').map(o => o.trim().toUpperCase()).filter(Boolean)
      : ['ON', 'OFF']
    const newItem = {
      id: `st-${Date.now()}`,
      label: newStatusLabel.trim(),
      value: opts[0],
      options: opts
    }
    setField('outreach.statuses', [...d.statuses, newItem])
    setNewStatusLabel('')
    setNewStatusOptions('')
  }

  function removeStatus(id) {
    setField('outreach.statuses', d.statuses.filter(s => s.id !== id))
  }

  function updateStatusValue(id, value) {
    setField('outreach.statuses', d.statuses.map(s => s.id === id ? { ...s, value } : s))
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1>Outreach / Lead Gen</h1>
        <p className="section-desc">Everything focused on booking more sales calls.</p>
      </div>

      <div className="counter-pipeline">
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
            <div className="counter-step" style={{ flex: 1 }}>
              <div className="counter-step-value">
                <InlineNumberEdit value={s.value} onSave={v => setField(`outreach.pipeline.${s.key}`, v)} />
              </div>
              <div className="counter-step-label">{s.label}</div>
            </div>
            {i < steps.length - 1 && <div className="counter-step-arrow">→</div>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Today's Checklist</h2>
          <TaskList tasks={d.todayChecklist} showDue={false}
            onToggle={id => toggleTask('outreach.todayChecklist', id)}
            onDelete={id => removeFromArray('outreach.todayChecklist', id)}
            onUpdate={(id, updates) => updateInArray('outreach.todayChecklist', id, updates)}
          />
          <div style={{ marginTop: 8 }}>
            <AddTaskForm onAdd={task => addToArray('outreach.todayChecklist', task)} placeholder="Add checklist item..." />
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Weekly Goals</h2>
            <GoalList goals={d.weeklyGoals} path="outreach.weeklyGoals" setField={setField} />
          </div>
          <div className="card">
            <h2>Monthly Goals</h2>
            <GoalList goals={d.monthlyGoals} path="outreach.monthlyGoals" setField={setField} />
          </div>
          <div className="card">
            <h2>Status</h2>
            <div className="stack-sm" style={{ gap: 10 }}>
              {d.statuses.map(s => (
                <div className="row-between" key={s.id}>
                  <span className="small muted">{s.label}</span>
                  <div className="row" style={{ gap: 6 }}>
                    <select className="select" value={s.value} onChange={e => updateStatusValue(s.id, e.target.value)}>
                      {s.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <button className="task-delete" onClick={() => removeStatus(s.id)} title="Remove">×</button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={addStatus} className="add-form" style={{ marginTop: 10 }}>
              <input className="input" placeholder="Status name..." value={newStatusLabel} onChange={e => setNewStatusLabel(e.target.value)} style={{ flex: 1 }} />
              <input className="input" placeholder="Options (comma sep)" value={newStatusOptions} onChange={e => setNewStatusOptions(e.target.value)} style={{ flex: 1, fontSize: 12 }} />
              <button type="submit" className="btn btn-outline" disabled={!newStatusLabel.trim()}>Add</button>
            </form>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Daily Log</h2>
        <AddNoteForm onAdd={note => setField('outreach.log', [note, ...d.log])} placeholder="Add log entry..." />
        <div style={{ marginTop: 8 }}>
          <LogEntries entries={d.log}
            onDelete={i => setField('outreach.log', d.log.filter((_, idx) => idx !== i))}
            onUpdate={(i, text) => setField('outreach.log', d.log.map((e, idx) => idx === i ? { ...e, text } : e))}
          />
        </div>
      </div>

      <NotionLinks path="outreach.notionLinks" />
    </div>
  )
}
