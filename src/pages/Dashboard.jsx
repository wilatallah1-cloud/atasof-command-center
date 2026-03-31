import { useState } from 'react'
import { useData } from '../context/DataContext'
import LogEntries from '../components/LogEntries'
import { AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import { GoalList } from '../components/EditableGoal'
import NotionLinks from '../components/NotionLinks'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}

const TODAY = new Date().toISOString().split('T')[0]

function parseCAD(str) {
  if (!str) return 0
  const num = parseFloat(String(str).replace(/[^0-9.]/g, ''))
  return isNaN(num) ? 0 : num
}

function formatCAD(amount) {
  return `$${Math.round(amount).toLocaleString('en-CA')} CAD`
}

function monthsSince(dateStr) {
  if (!dateStr) return 1
  const start = new Date(dateStr)
  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(1, months)
}

// Aggregate tasks from all pages that are due today
function getTodayTasks(data) {
  const all = []

  // Dashboard own tasks
  ;(data.dashboard.todayFocus || []).forEach(t => {
    all.push({ ...t, _source: 'Dashboard', _path: 'dashboard.todayFocus', _type: 'focus' })
  })

  // Outreach checklist — always today
  ;(data.outreach.todayChecklist || []).forEach(t => {
    all.push({ ...t, _source: 'Outreach', _path: 'outreach.todayChecklist', _type: 'task' })
  })

  // AI App tasks due today
  ;(data.aiSaas.phases || []).forEach((phase, i) => {
    ;(phase.tasks || []).filter(t => t.dueDate === TODAY).forEach(t => {
      all.push({ ...t, _source: `AI App · ${phase.name}`, _path: `aiSaas.phases.${i}.tasks`, _type: 'task' })
    })
  })

  // Coaching tasks due today
  ;(data.coaching.tasks || []).filter(t => t.dueDate === TODAY).forEach(t => {
    all.push({ ...t, _source: 'Coaching', _path: 'coaching.tasks', _type: 'task' })
  })

  // Client tasks due today
  ;(data.clients || []).forEach((client, ci) => {
    ;(client.tasks || []).filter(t => t.dueDate === TODAY).forEach(t => {
      all.push({ ...t, _source: client.name, _path: `clients.${ci}.tasks`, _type: 'task' })
    })
  })

  return all
}

function getProjectSummary(data) {
  const summaries = []
  const oc = data.outreach.todayChecklist
  const ocDone = oc.filter(t => t.completed).length
  summaries.push({ name: 'Outreach', pct: oc.length > 0 ? Math.round((ocDone / oc.length) * 100) : 0, next: `${data.outreach.pipeline.meetingsBooked} meetings booked` })

  const allClientTasks = data.clients.flatMap(c => c.tasks || [])
  const clientDone = allClientTasks.filter(t => t.completed).length
  summaries.push({ name: 'Clients', pct: allClientTasks.length > 0 ? Math.round((clientDone / allClientTasks.length) * 100) : 0, next: data.clients[0]?.nextAction || 'No clients yet' })

  const allSaasTasks = data.aiSaas.phases.flatMap(p => p.tasks)
  const saasDone = allSaasTasks.filter(t => t.completed).length
  summaries.push({ name: 'AI App', pct: allSaasTasks.length > 0 ? Math.round((saasDone / allSaasTasks.length) * 100) : 0, next: allSaasTasks.find(t => !t.completed)?.title || 'No tasks yet' })

  const coachDone = data.coaching.tasks.filter(t => t.completed).length
  summaries.push({ name: 'Coaching', pct: data.coaching.tasks.length > 0 ? Math.round((coachDone / data.coaching.tasks.length) * 100) : 0, next: data.coaching.tasks.find(t => !t.completed)?.title || 'No tasks yet' })

  const ytPub = data.youtube.pipeline.published.length
  const ytTotal = Object.values(data.youtube.pipeline).flat().length
  summaries.push({ name: 'Content', pct: ytTotal > 0 ? Math.round((ytPub / ytTotal) * 100) : 0, next: ytTotal > 0 ? `${ytPub} published` : 'No content yet' })

  return summaries
}

const SOURCE_COLORS = {
  'Dashboard': 'var(--text-muted)',
  'Outreach': 'var(--accent)',
  'Coaching': 'var(--green)',
  'AI App': 'var(--yellow)',
}

function sourceColor(src) {
  for (const [key, val] of Object.entries(SOURCE_COLORS)) {
    if (src.startsWith(key)) return val
  }
  return 'var(--orange)'
}

const DESTINATIONS = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Outreach Checklist', value: 'outreach' },
  { label: 'AI App (current phase)', value: 'aisaas' },
  { label: 'Coaching', value: 'coaching' },
]

export default function Dashboard() {
  const { data, setField, addToArray, removeFromArray, updateInArray, toggleTask } = useData()
  const d = data.dashboard
  const summaries = getProjectSummary(data)
  const todayTasks = getTodayTasks(data)

  const [newTask, setNewTask] = useState('')
  const [newDest, setNewDest] = useState('dashboard')
  const [newAssignee, setNewAssignee] = useState('Both')

  // Compute destinations including each client
  const destinations = [
    ...DESTINATIONS,
    ...data.clients.map(c => ({ label: `Client: ${c.name}`, value: `client:${c.id}` }))
  ]

  function addTodayTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    const base = {
      id: `task-${Date.now()}`,
      title: newTask.trim(),
      completed: false,
      assignee: newAssignee,
      dueDate: TODAY,
      createdAt: new Date().toISOString(),
    }

    if (newDest === 'dashboard') {
      addToArray('dashboard.todayFocus', { ...base, source: 'Dashboard' })
    } else if (newDest === 'outreach') {
      addToArray('outreach.todayChecklist', base)
    } else if (newDest === 'aisaas') {
      const phase = data.aiSaas.currentPhase
      addToArray(`aiSaas.phases.${phase}.tasks`, base)
    } else if (newDest === 'coaching') {
      addToArray('coaching.tasks', base)
    } else if (newDest.startsWith('client:')) {
      const clientId = newDest.replace('client:', '')
      const ci = data.clients.findIndex(c => c.id === clientId)
      if (ci >= 0) addToArray(`clients.${ci}.tasks`, base)
    }

    setNewTask('')
  }

  function toggleTodayTask(task) {
    if (task._type === 'focus') {
      // dashboard.todayFocus items use updateInArray
      updateInArray(task._path, task.id, { completed: !task.completed })
    } else {
      toggleTask(task._path, task.id)
    }
  }

  function deleteTodayTask(task) {
    removeFromArray(task._path, task.id)
  }

  const done = todayTasks.filter(t => t.completed).length

  // Revenue calculations
  const activeClients = data.clients.filter(c => c.status === 'ACTIVE')
  const mrr = activeClients.reduce((sum, c) => sum + parseCAD(c.monthly), 0)
  const mrrGoal = data.mrrGoal || 5000
  const mrrProgress = Math.min(100, (mrr / mrrGoal) * 100)
  const totalCashCollected = data.clients.reduce((sum, c) => {
    const setup = parseCAD(c.setupFee)
    const monthly = parseCAD(c.monthly)
    const months = monthsSince(c.startDate)
    return sum + setup + monthly * months
  }, 0)

  return (
    <div className="stack">
      <div className="section-header">
        <p className="muted small mono">{formatDate()}</p>
        <h1>{getGreeting()}. <InlineEdit value={d.greeting} onSave={v => setField('dashboard.greeting', v)} /></h1>
      </div>

      {/* Revenue Widget */}
      <div className="card">
        <h3 style={{ margin: '0 0 12px 0' }}>Revenue</h3>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 14 }}>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>MRR</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
              {formatCAD(mrr)}
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Monthly Goal</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
              <InlineEdit value={formatCAD(mrrGoal)} onSave={v => setField('mrrGoal', parseCAD(v))} />
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Total Cash Collected</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1, color: 'var(--green, #4ade80)' }}>
              {formatCAD(totalCashCollected)}
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Active Clients</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
              {activeClients.length}
            </div>
          </div>
        </div>
        <div className="progress-bar-track" style={{ height: 6 }}>
          <div className="progress-bar-fill" style={{ width: `${mrrProgress}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div className="row-between" style={{ marginTop: 4 }}>
          <span className="small dim">{Math.round(mrrProgress)}% to goal</span>
          <span className="small dim">{mrr >= mrrGoal ? 'Goal reached' : `${formatCAD(mrrGoal - mrr)} to go`}</span>
        </div>
      </div>

      {/* Today's Tasks — unified view */}
      <div className="card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Today's Tasks</h2>
          <span className="mono small muted">{done}/{todayTasks.length} done</span>
        </div>

        {todayTasks.length > 0 && (
          <div className="stack-sm" style={{ marginBottom: 12 }}>
            {todayTasks.map(task => (
              <div key={`${task._path}-${task.id}`} className={`today-task-row${task.completed ? ' completed' : ''}`}>
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={!!task.completed}
                  onChange={() => toggleTodayTask(task)}
                />
                <span className="today-task-title">{task.title}</span>
                {task.assignee && task.assignee !== 'Both' && (
                  <span className="assignee-badge">{task.assignee}</span>
                )}
                <span className="source-badge" style={{ color: sourceColor(task._source), borderColor: sourceColor(task._source) }}>
                  {task._source}
                </span>
                <button className="task-delete" onClick={() => deleteTodayTask(task)}>×</button>
              </div>
            ))}
          </div>
        )}

        {todayTasks.length === 0 && (
          <p className="muted small" style={{ marginBottom: 12 }}>No tasks for today yet. Add one below.</p>
        )}

        {/* Add task form */}
        <form onSubmit={addTodayTask} className="add-form" style={{ flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="Add a task for today..."
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            style={{ flex: 1, minWidth: 160 }}
          />
          <select className="select" value={newDest} onChange={e => setNewDest(e.target.value)} style={{ fontSize: 12 }}>
            {destinations.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select className="select" value={newAssignee} onChange={e => setNewAssignee(e.target.value)} style={{ width: 90, fontSize: 12 }}>
            <option value="Both">Both</option>
            <option value="William">William</option>
            <option value="Dad">Dad</option>
          </select>
          <button type="submit" className="btn btn-accent" disabled={!newTask.trim()}>Add</button>
        </form>
      </div>

      {/* Project Summaries */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
        {summaries.map(s => (
          <div className="card" key={s.name}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13 }}>{s.name}</h3>
              <span className="mono small muted">{s.pct}%</span>
            </div>
            <div className="progress-bar-track" style={{ marginBottom: 8 }}>
              <div className="progress-bar-fill" style={{ width: `${s.pct}%` }} />
            </div>
            <p className="small muted" style={{ fontSize: 11, lineHeight: 1.4 }}>{s.next}</p>
          </div>
        ))}
      </div>

      {/* Weekly Goals */}
      <div className="card">
        <h2>Weekly Goals</h2>
        <GoalList goals={d.weeklyGoals} path="dashboard.weeklyGoals" setField={setField} />
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2>Recent Activity</h2>
        <AddNoteForm onAdd={note => setField('dashboard.recentActivity', [note, ...d.recentActivity])} placeholder="Log an activity..." />
        <div style={{ marginTop: 8 }}>
          <LogEntries entries={d.recentActivity}
            onDelete={i => setField('dashboard.recentActivity', d.recentActivity.filter((_, idx) => idx !== i))}
            onUpdate={(i, text) => setField('dashboard.recentActivity', d.recentActivity.map((e, idx) => idx === i ? { ...e, text } : e))}
          />
        </div>
      </div>

      <NotionLinks path="dashboard.notionLinks" />
    </div>
  )
}
