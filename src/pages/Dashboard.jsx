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

function getProjectSummary(data) {
  const summaries = []
  const oc = data.outreach.todayChecklist
  const ocDone = oc.filter(t => t.completed).length
  summaries.push({ name: 'Outreach', pct: oc.length > 0 ? Math.round((ocDone / oc.length) * 100) : 0, next: `${data.outreach.pipeline.meetingsBooked} meetings booked` })

  const allClientTasks = data.clients.flatMap(c => c.tasks)
  const clientDone = allClientTasks.filter(t => t.completed).length
  summaries.push({ name: 'Clients', pct: allClientTasks.length > 0 ? Math.round((clientDone / allClientTasks.length) * 100) : 0, next: data.clients[0]?.nextAction || 'No clients yet' })

  const allSaasTasks = data.aiSaas.phases.flatMap(p => p.tasks)
  const saasDone = allSaasTasks.filter(t => t.completed).length
  summaries.push({ name: 'AI Content SaaS', pct: allSaasTasks.length > 0 ? Math.round((saasDone / allSaasTasks.length) * 100) : 0, next: allSaasTasks.find(t => !t.completed)?.title || 'No tasks yet' })

  const coachDone = data.coaching.tasks.filter(t => t.completed).length
  summaries.push({ name: 'Coaching', pct: data.coaching.tasks.length > 0 ? Math.round((coachDone / data.coaching.tasks.length) * 100) : 0, next: data.coaching.tasks.find(t => !t.completed)?.title || 'No tasks yet' })

  const ytPub = data.youtube.pipeline.published.length
  const ytTotal = Object.values(data.youtube.pipeline).flat().length
  summaries.push({ name: 'YouTube', pct: ytTotal > 0 ? Math.round((ytPub / ytTotal) * 100) : 0, next: ytTotal > 0 ? `${ytPub} published` : 'No videos yet' })

  return summaries
}

export default function Dashboard() {
  const { data, setField, addToArray, removeFromArray, updateInArray } = useData()
  const d = data.dashboard
  const summaries = getProjectSummary(data)

  return (
    <div className="stack">
      <div className="section-header">
        <p className="muted small mono">{formatDate()}</p>
        <h1>{getGreeting()}. <InlineEdit value={d.greeting} onSave={v => setField('dashboard.greeting', v)} /></h1>
      </div>

      {/* Today's Focus */}
      <div className="card">
        <h2>Today's Focus</h2>
        {d.todayFocus.length > 0 && (
          <div className="stack-sm" style={{ marginBottom: 8 }}>
            {d.todayFocus.map((item, i) => (
              <div className="row" key={item.id} style={{ padding: '6px 0' }}>
                <span className="mono" style={{ color: 'var(--accent)', fontSize: 14, minWidth: 20 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <InlineEdit value={item.title} onSave={v => updateInArray('dashboard.todayFocus', item.id, { title: v })} />
                <span className="mono small dim" style={{ marginLeft: 'auto' }}>
                  <InlineEdit value={item.source} onSave={v => updateInArray('dashboard.todayFocus', item.id, { source: v })} />
                </span>
                <button className="task-delete" onClick={() => removeFromArray('dashboard.todayFocus', item.id)}>×</button>
              </div>
            ))}
          </div>
        )}
        <form className="add-form" onSubmit={e => {
          e.preventDefault()
          const input = e.target.elements.title
          const source = e.target.elements.source
          if (!input.value.trim()) return
          addToArray('dashboard.todayFocus', { id: `tf-${Date.now()}`, title: input.value.trim(), source: source.value })
          input.value = ''
        }}>
          <input name="title" className="input" placeholder="Add focus item..." style={{ flex: 1 }} />
          <select name="source" className="select">
            <option>Outreach</option><option>Clients</option><option>AI Content SaaS</option><option>Coaching</option><option>YouTube</option><option>Other</option>
          </select>
          <button type="submit" className="btn btn-accent">Add</button>
        </form>
      </div>

      {/* Project Summaries */}
      <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
        {summaries.map(s => (
          <div className="card" key={s.name}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{s.name}</h3>
              <span className="mono small muted">{s.pct}%</span>
            </div>
            <div className="progress-bar-track" style={{ marginBottom: 10 }}>
              <div className="progress-bar-fill" style={{ width: `${s.pct}%` }} />
            </div>
            <p className="small muted">{s.next}</p>
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
