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

function monthsBetween(startStr, endStr) {
  if (!startStr) return 1
  const start = new Date(startStr)
  const end = endStr ? new Date(endStr) : new Date()
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  return Math.max(1, months)
}

function getClientCashCollected(client) {
  if (client.status === 'WAITING ON CLIENT') return 0
  const revenueLog = client.revenueLog || []
  const setupFee = parseCAD(client.setupFee)
  if (revenueLog.length > 0) {
    return setupFee + revenueLog.reduce((sum, e) => sum + (e.amount || 0), 0)
  }
  const monthly = parseCAD(client.monthly)
  if (client.status === 'NO LONGER ACTIVE') {
    return setupFee + monthly * monthsBetween(client.startDate, client.endDate)
  }
  return setupFee + monthly * monthsBetween(client.startDate)
}

function getClientMRR(client) {
  if (client.status !== 'ACTIVE') return 0
  if (client.dealType === 'revshare') {
    const base = client.revshareBase || 0
    const varEntries = (client.revenueLog || [])
      .filter(e => e.type === 'revshare')
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 3)
    const avgVar = varEntries.length > 0
      ? varEntries.reduce((s, e) => s + (e.amount || 0), 0) / varEntries.length
      : 0
    return base + avgVar
  }
  return parseCAD(client.monthly)
}

// Aggregate tasks from centralized tasks array that are due today
function getTodayTasks(data) {
  return (data.tasks || [])
    .filter(t => t.dueDate === TODAY && t.status !== 'done')
    .map(t => ({
      ...t,
      _source: SECTION_LABELS[t.section] || t.section,
    }))
}

const SECTION_LABELS = {
  dashboard: 'Dashboard',
  outreach: 'Outreach',
  clients: 'Clients',
  'ai-app': 'AI App',
  coaching: 'Coaching',
  content: 'Content',
}

function getProjectSummary(data) {
  const tasks = data.tasks || []
  const summaries = []

  function sectionStats(section) {
    const s = tasks.filter(t => t.section === section)
    const done = s.filter(t => t.status === 'done').length
    return { total: s.length, done, pct: s.length > 0 ? Math.round((done / s.length) * 100) : 0 }
  }

  const outreach = sectionStats('outreach')
  summaries.push({ name: 'Outreach', pct: outreach.pct, next: `${data.outreach.pipeline.meetingsBooked} meetings booked` })

  const clients = sectionStats('clients')
  summaries.push({ name: 'Clients', pct: clients.pct, next: data.clients[0]?.nextAction || 'No clients yet' })

  const aiApp = sectionStats('ai-app')
  summaries.push({ name: 'AI App', pct: aiApp.pct, next: tasks.find(t => t.section === 'ai-app' && t.status !== 'done')?.title || 'No tasks yet' })

  const coaching = sectionStats('coaching')
  summaries.push({ name: 'Coaching', pct: coaching.pct, next: tasks.find(t => t.section === 'coaching' && t.status !== 'done')?.title || 'No tasks yet' })

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

const SECTION_OPTIONS = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Outreach', value: 'outreach' },
  { label: 'AI App', value: 'ai-app' },
  { label: 'Coaching', value: 'coaching' },
  { label: 'Content', value: 'content' },
]

export default function Dashboard() {
  const { data, setField, addToArray, removeFromArray, updateInArray } = useData()
  const d = data.dashboard
  const summaries = getProjectSummary(data)
  const todayTasks = getTodayTasks(data)

  const [newTask, setNewTask] = useState('')
  const [newSection, setNewSection] = useState('dashboard')
  const [newAssignee, setNewAssignee] = useState('Both')

  // Compute section options including each client
  const sectionOptions = [
    ...SECTION_OPTIONS,
    ...data.clients.map(c => ({ label: `Client: ${c.name}`, value: `client:${c.id}` }))
  ]

  function addTodayTask(e) {
    e.preventDefault()
    if (!newTask.trim()) return
    let section = newSection
    let sectionRefId = null
    if (newSection.startsWith('client:')) {
      section = 'clients'
      sectionRefId = newSection.replace('client:', '')
    } else if (newSection === 'ai-app') {
      sectionRefId = String(data.aiSaas.currentPhase)
    }
    addToArray('tasks', {
      id: `task-${Date.now()}`,
      title: newTask.trim(),
      status: 'todo',
      assignee: newAssignee,
      section,
      sectionRefId,
      dueDate: TODAY,
      scheduledTime: null,
      duration: 60,
      priority: 'normal',
      createdAt: new Date().toISOString(),
      completedAt: null,
    })
    setNewTask('')
  }

  function toggleTodayTask(task) {
    const newStatus = task.status === 'done' ? 'todo' : 'done'
    updateInArray('tasks', task.id, {
      status: newStatus,
      completedAt: newStatus === 'done' ? new Date().toISOString() : null,
    })
  }

  function deleteTodayTask(task) {
    removeFromArray('tasks', task.id)
  }

  const allToday = (data.tasks || []).filter(t => t.dueDate === TODAY)
  const done = allToday.filter(t => t.status === 'done').length

  // Revenue calculations
  const activeClients = data.clients.filter(c => c.status === 'ACTIVE')
  const mrr = activeClients.reduce((sum, c) => sum + getClientMRR(c), 0)
  const mrrGoal = data.mrrGoal || 5000
  const mrrProgress = Math.min(100, (mrr / mrrGoal) * 100)
  const totalCashCollected = data.clients.reduce((sum, c) => sum + getClientCashCollected(c), 0)

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
          <span className="mono small muted">{done}/{allToday.length} done</span>
        </div>

        {todayTasks.length > 0 && (
          <div className="stack-sm" style={{ marginBottom: 12 }}>
            {todayTasks.map(task => (
              <div key={task.id} className={`today-task-row${task.status === 'done' ? ' completed' : ''}`}>
                <input
                  type="checkbox"
                  className="task-checkbox"
                  checked={task.status === 'done'}
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
          <select className="select" value={newSection} onChange={e => setNewSection(e.target.value)} style={{ fontSize: 12 }}>
            {sectionOptions.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select className="select" value={newAssignee} onChange={e => setNewAssignee(e.target.value)} style={{ width: 90, fontSize: 12 }}>
            <option value="Both">Both</option>
            <option value="William">William</option>
            <option value="Fadi">Fadi</option>
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
