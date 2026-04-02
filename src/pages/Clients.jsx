import { useState } from 'react'
import { useData } from '../context/DataContext'
import TaskList from '../components/TaskList'
import LogEntries from '../components/LogEntries'
import { AddTaskForm, AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import NotionLinks from '../components/NotionLinks'

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
  const loggedTotal = revenueLog.reduce((sum, entry) => sum + (entry.amount || 0), 0)
  const setupFee = parseCAD(client.setupFee)

  if (revenueLog.length > 0) {
    return setupFee + loggedTotal
  }

  // Fallback: estimate from monthly × months
  const monthly = parseCAD(client.monthly)
  if (client.status === 'NO LONGER ACTIVE') {
    return setupFee + monthly * monthsBetween(client.startDate, client.endDate)
  }
  return setupFee + monthly * monthsBetween(client.startDate)
}

function getClientMRR(client) {
  if (client.status !== 'ACTIVE') return 0
  const revenueLog = client.revenueLog || []

  if (client.dealType === 'revshare') {
    const base = client.revshareBase || 0
    // Average the last 3 months of variable (non-base) revenue, or just base if no logs
    const varEntries = revenueLog
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

function RevenueLogger({ client, path, setField }) {
  const [month, setMonth] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })
  const [amount, setAmount] = useState('')
  const [type, setType] = useState(client.dealType === 'revshare' ? 'base' : 'flat')
  const [note, setNote] = useState('')

  function handleAdd(e) {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    const log = client.revenueLog || []
    const entry = {
      id: `rev-${Date.now()}`,
      month,
      amount: val,
      type,
      note: note.trim() || null,
      loggedAt: new Date().toISOString(),
    }
    setField(`${path}.revenueLog`, [entry, ...log])
    setAmount('')
    setNote('')
  }

  const log = (client.revenueLog || []).sort((a, b) => b.month.localeCompare(a.month))

  return (
    <div style={{ marginTop: 16 }}>
      <h3>Revenue Log</h3>
      <form className="add-form" onSubmit={handleAdd} style={{ gap: 8, marginBottom: 12 }}>
        <input type="month" className="input" value={month} onChange={e => setMonth(e.target.value)} style={{ width: 150 }} />
        <input type="number" className="input" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} style={{ width: 110 }} min="0" step="0.01" />
        {client.dealType === 'revshare' && (
          <select className="select" value={type} onChange={e => setType(e.target.value)}>
            <option value="base">Base</option>
            <option value="revshare">Rev Share</option>
          </select>
        )}
        <input className="input" placeholder="Note (optional)" value={note} onChange={e => setNote(e.target.value)} style={{ flex: 1 }} />
        <button type="submit" className="btn btn-accent">Log</button>
      </form>
      {log.length > 0 && (
        <div className="revenue-log-list">
          {log.map(entry => (
            <div key={entry.id} className="revenue-log-entry">
              <span className="mono small">{entry.month}</span>
              <span className="mono small" style={{ color: 'var(--accent)', fontWeight: 600 }}>{formatCAD(entry.amount)}</span>
              {entry.type !== 'flat' && (
                <span className="source-badge" style={{
                  background: entry.type === 'revshare' ? 'rgba(0,255,136,0.1)' : 'rgba(0,212,255,0.1)',
                  color: entry.type === 'revshare' ? '#00FF88' : '#00D4FF',
                  fontSize: 10,
                }}>
                  {entry.type === 'revshare' ? '% split' : 'base'}
                </span>
              )}
              {entry.note && <span className="small muted">{entry.note}</span>}
              <button
                className="task-delete"
                style={{ marginLeft: 'auto' }}
                onClick={() => setField(`${path}.revenueLog`, (client.revenueLog || []).filter(e => e.id !== entry.id))}
              >×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ClientCard({ client, clientIdx }) {
  const { data, setField, removeFromArray, updateInArray, addToArray } = useData()
  const [expanded, setExpanded] = useState(false)
  const path = `clients.${clientIdx}`
  const clientTasks = (data.tasks || []).filter(t => t.section === 'clients' && t.sectionRefId === client.id)
  const doneTasks = clientTasks.filter(t => t.status === 'done').length
  const totalTasks = clientTasks.length

  const statusOptions = ['ACTIVE', 'NEEDS ATTENTION', 'WAITING ON CLIENT', 'NO LONGER ACTIVE']
  const dealTypes = [{ value: 'flat', label: 'Flat Monthly' }, { value: 'revshare', label: 'Rev Share + Base' }]

  const ltv = getClientCashCollected(client)
  const clientMrr = getClientMRR(client)

  function handleStatusChange(newStatus) {
    setField(`${path}.status`, newStatus)
    if (newStatus === 'NO LONGER ACTIVE' && !client.endDate) {
      setField(`${path}.endDate`, new Date().toISOString().split('T')[0])
    }
    if (newStatus === 'ACTIVE' && client.endDate) {
      setField(`${path}.endDate`, null)
    }
  }

  function deleteClient() {
    if (confirm(`Delete ${client.name}?`)) {
      setField('clients', data.clients.filter(c => c.id !== client.id))
    }
  }

  const isRevShare = client.dealType === 'revshare'

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>
              <InlineEdit value={client.name} onSave={v => setField(`${path}.name`, v)} />
            </h2>
            <select className="select" value={client.status} onChange={e => handleStatusChange(e.target.value)}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="small muted">
            <InlineEdit value={client.service} onSave={v => setField(`${path}.service`, v)} />
          </p>
        </div>
        <button className="task-delete" onClick={deleteClient} title="Delete client">×</button>
      </div>

      <div style={{ display: 'flex', gap: 24, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="small muted" style={{ marginBottom: 2 }}>Deal Type</div>
          <select className="select" value={client.dealType || 'flat'} onChange={e => setField(`${path}.dealType`, e.target.value)} style={{ fontSize: 12 }}>
            {dealTypes.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>
        {isRevShare ? (
          <>
            <div>
              <div className="small muted" style={{ marginBottom: 2 }}>Base Monthly</div>
              <div className="mono small">
                <InlineEdit value={formatCAD(client.revshareBase || 0)} onSave={v => setField(`${path}.revshareBase`, parseCAD(v))} />
              </div>
            </div>
            <div>
              <div className="small muted" style={{ marginBottom: 2 }}>Rev Share %</div>
              <div className="mono small">
                <InlineEdit value={`${client.revsharePercent || 0}%`} onSave={v => setField(`${path}.revsharePercent`, parseFloat(v) || 0)} />
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="small muted" style={{ marginBottom: 2 }}>Monthly</div>
            <div className="mono small">
              <InlineEdit value={client.monthly || '$0 CAD'} onSave={v => setField(`${path}.monthly`, v)} />
            </div>
          </div>
        )}
        <div>
          <div className="small muted" style={{ marginBottom: 2 }}>Setup Fee</div>
          <div className="mono small">
            <InlineEdit value={client.setupFee || '$0 CAD'} onSave={v => setField(`${path}.setupFee`, v)} />
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 2 }}>Start Date</div>
          <div className="mono small">
            {client.startDate
              ? <InlineEdit value={client.startDate} onSave={v => setField(`${path}.startDate`, v)} />
              : <span
                  className="dim"
                  style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                  onClick={() => setField(`${path}.startDate`, new Date().toISOString().split('T')[0])}
                >+ set date</span>
            }
          </div>
        </div>
        {client.status === 'NO LONGER ACTIVE' && (
          <div>
            <div className="small muted" style={{ marginBottom: 2 }}>End Date</div>
            <div className="mono small">
              {client.endDate
                ? <InlineEdit value={client.endDate} onSave={v => setField(`${path}.endDate`, v)} />
                : <span
                    className="dim"
                    style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                    onClick={() => setField(`${path}.endDate`, new Date().toISOString().split('T')[0])}
                  >+ set date</span>
              }
            </div>
          </div>
        )}
        <div>
          <div className="small muted" style={{ marginBottom: 2 }}>Effective MRR</div>
          <div className="mono small" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {formatCAD(clientMrr)}
          </div>
        </div>
        <div>
          <div className="small muted" style={{ marginBottom: 2 }}>Cash Collected</div>
          <div className="mono small" style={{ color: client.status === 'WAITING ON CLIENT' ? 'var(--text-muted)' : 'var(--green, #4ade80)', fontWeight: 600 }}>
            {formatCAD(ltv)}
          </div>
        </div>
      </div>

      {totalTasks > 0 && (
        <div className="row-between" style={{ marginBottom: 12 }}>
          <span className="small muted">Tasks: {doneTasks}/{totalTasks}</span>
          <div className="progress-bar-track" style={{ width: 120 }}>
            <div className="progress-bar-fill" style={{ width: `${(doneTasks / totalTasks) * 100}%` }} />
          </div>
        </div>
      )}

      <div style={{ marginBottom: 8 }}>
        <span className="small" style={{ color: 'var(--accent)' }}>Next: </span>
        <InlineEdit value={client.nextAction} onSave={v => setField(`${path}.nextAction`, v)} className="small" />
        {client.nextActionDue && (
          <span className="mono small dim" style={{ marginLeft: 8 }}>
            <InlineEdit value={client.nextActionDue} onSave={v => setField(`${path}.nextActionDue`, v)} />
          </span>
        )}
      </div>

      <button className="client-expand-btn" onClick={() => setExpanded(!expanded)}>
        {expanded ? '▾ Collapse' : '▸ Show details'}
      </button>

      {expanded && (
        <div style={{ marginTop: 12 }}>
          <h3>Tasks</h3>
          <TaskList tasks={clientTasks.map(t => ({ ...t, completed: t.status === 'done' }))}
            onToggle={id => {
              const t = clientTasks.find(x => x.id === id)
              if (t) updateInArray('tasks', id, {
                status: t.status === 'done' ? 'todo' : 'done',
                completedAt: t.status === 'done' ? null : new Date().toISOString()
              })
            }}
            onDelete={id => removeFromArray('tasks', id)}
            onUpdate={(id, updates) => updateInArray('tasks', id, updates)}
          />
          <div style={{ marginTop: 8 }}>
            <AddTaskForm onAdd={task => addToArray('tasks', {
              ...task,
              status: 'todo',
              section: 'clients',
              sectionRefId: client.id,
              scheduledTime: null,
              duration: 60,
              priority: 'normal',
              completedAt: null,
              dueDate: task.dueDate || new Date().toISOString().split('T')[0],
            })} />
          </div>

          <RevenueLogger client={client} path={path} setField={setField} />

          <div style={{ marginTop: 16 }}>
            <h3>Notes</h3>
            <AddNoteForm onAdd={note => setField(`${path}.notes`, [note, ...(client.notes || [])])} />
            <div style={{ marginTop: 8 }}>
              <LogEntries entries={client.notes || []}
                onDelete={i => setField(`${path}.notes`, client.notes.filter((_, idx) => idx !== i))}
                onUpdate={(i, text) => setField(`${path}.notes`, client.notes.map((e, idx) => idx === i ? { ...e, text } : e))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Clients() {
  const { data, setField } = useData()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newService, setNewService] = useState('')

  const activeClients = data.clients.filter(c => c.status === 'ACTIVE')
  const mrr = activeClients.reduce((sum, c) => sum + getClientMRR(c), 0)
  const mrrGoal = data.mrrGoal || 5000
  const mrrProgress = Math.min(100, (mrr / mrrGoal) * 100)
  const totalCashCollected = data.clients.reduce((sum, c) => sum + getClientCashCollected(c), 0)

  function addClient(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setField('clients', [...data.clients, {
      id: `client-${Date.now()}`,
      name: newName.trim(),
      service: newService.trim() || 'TBD',
      status: 'ACTIVE',
      dealType: 'flat',
      monthly: '$0 CAD',
      setupFee: '$0 CAD',
      startDate: new Date().toISOString().split('T')[0],
      revenueLog: [],
      tasks: [],
      nextAction: 'Define scope',
      nextActionDue: null,
      notes: []
    }])
    setNewName('')
    setNewService('')
    setShowAdd(false)
  }

  return (
    <div className="stack">
      <div className="row-between">
        <div className="section-header">
          <h1>Clients</h1>
          <p className="section-desc">Active client projects and deliverables.</p>
        </div>
        <button className="btn btn-accent" onClick={() => setShowAdd(!showAdd)}>+ Add Client</button>
      </div>

      <div className="card">
        <div className="row-between" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Monthly Recurring Revenue</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="small muted">Goal:</span>
            <span className="mono small">
              <InlineEdit
                value={formatCAD(mrrGoal)}
                onSave={v => setField('mrrGoal', parseCAD(v))}
              />
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 14, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Current MRR</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
              {formatCAD(mrr)}
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Active clients</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
              {activeClients.length}
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>Total Cash Collected</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1, color: 'var(--green, #4ade80)' }}>
              {formatCAD(totalCashCollected)}
            </div>
          </div>
          <div>
            <div className="small muted" style={{ marginBottom: 4 }}>To goal</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1, color: mrr >= mrrGoal ? 'var(--accent)' : undefined }}>
              {mrr >= mrrGoal ? '✓ Hit' : formatCAD(mrrGoal - mrr)}
            </div>
          </div>
        </div>
        <div className="progress-bar-track" style={{ height: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${mrrProgress}%`, transition: 'width 0.3s ease' }} />
        </div>
        <div className="row-between" style={{ marginTop: 4 }}>
          <span className="small dim">$0</span>
          <span className="small dim">{Math.round(mrrProgress)}% of goal</span>
          <span className="small dim">{formatCAD(mrrGoal)}</span>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={addClient} className="card add-form" style={{ gap: 8 }}>
          <input className="input" placeholder="Client name" value={newName} onChange={e => setNewName(e.target.value)} style={{ flex: 1 }} />
          <input className="input" placeholder="Service" value={newService} onChange={e => setNewService(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-accent">Create</button>
          <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
        </form>
      )}

      {data.clients.length === 0 && !showAdd && (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p className="muted">No clients yet. Click + Add Client to get started.</p>
        </div>
      )}

      {data.clients.map((client, i) => (
        <ClientCard key={client.id} client={client} clientIdx={i} />
      ))}

      <NotionLinks path="clientsNotionLinks" />
    </div>
  )
}
