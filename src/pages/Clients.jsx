import { useState } from 'react'
import { useData } from '../context/DataContext'
import TaskList from '../components/TaskList'
import LogEntries from '../components/LogEntries'
import { AddTaskForm, AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import NotionLinks from '../components/NotionLinks'

function ClientCard({ client, clientIdx }) {
  const { data, setField, toggleTask, removeFromArray, updateInArray, addToArray } = useData()
  const [expanded, setExpanded] = useState(false)
  const path = `clients.${clientIdx}`
  const doneTasks = client.tasks.filter(t => t.completed).length
  const totalTasks = client.tasks.length

  const statusOptions = ['ACTIVE', 'NEEDS ATTENTION', 'WAITING ON CLIENT']

  function deleteClient() {
    if (confirm(`Delete ${client.name}?`)) {
      setField('clients', data.clients.filter(c => c.id !== client.id))
    }
  }

  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <div>
          <div className="row" style={{ gap: 10, marginBottom: 4 }}>
            <h2 style={{ margin: 0 }}>
              <InlineEdit value={client.name} onSave={v => setField(`${path}.name`, v)} />
            </h2>
            <select className="select" value={client.status} onChange={e => setField(`${path}.status`, e.target.value)}>
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <p className="small muted">
            <InlineEdit value={client.service} onSave={v => setField(`${path}.service`, v)} />
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <InlineEdit value={client.monthly} onSave={v => setField(`${path}.monthly`, v)} className="mono small muted" />
          <button className="task-delete" onClick={deleteClient} title="Delete client">×</button>
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
          <TaskList tasks={client.tasks}
            onToggle={id => toggleTask(`${path}.tasks`, id)}
            onDelete={id => removeFromArray(`${path}.tasks`, id)}
            onUpdate={(id, updates) => updateInArray(`${path}.tasks`, id, updates)}
          />
          <div style={{ marginTop: 8 }}>
            <AddTaskForm onAdd={task => addToArray(`${path}.tasks`, task)} />
          </div>

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

  function addClient(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setField('clients', [...data.clients, {
      id: `client-${Date.now()}`,
      name: newName.trim(),
      service: newService.trim() || 'TBD',
      status: 'ACTIVE',
      monthly: '$0 CAD',
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
