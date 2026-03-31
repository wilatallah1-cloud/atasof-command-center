import { useData } from '../context/DataContext'
import TaskList from '../components/TaskList'
import LogEntries from '../components/LogEntries'
import { AddTaskForm, AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import { GoalList } from '../components/EditableGoal'
import NotionLinks from '../components/NotionLinks'

export default function AIApp() {
  const { data, setField, addToArray, removeFromArray, updateInArray, toggleTask } = useData()
  const d = data.aiSaas

  return (
    <div className="stack">
      <div className="section-header">
        <h1>AI App</h1>
        <p className="section-desc">
          <InlineEdit value={d.description} onSave={v => setField('aiSaas.description', v)} />
        </p>
      </div>

      {/* Vision Overview */}
      <div className="card">
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent)' }}>The Vision</h3>
        <div className="small" style={{ lineHeight: 1.6 }}>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Jarvis</strong> — AI personal assistant & manager. Talks to you in real time, manages your calendar, emails, SMS, daily tasks, and plans your day. Has access to and manages all sub-agents.
          </p>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>AI Employees</strong> — Sub-agents that handle specific business tasks (hiring, customer service, operations, etc.). Jarvis manages them all — you just talk to Jarvis and it delegates.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Content Creation</strong> — AI clone of your voice + likeness. Auto-generates, schedules, and posts content. You approve, it publishes.
          </p>
        </div>
      </div>

      <div className="pipeline">
        {d.phases.map((phase, i) => {
          let cls = 'pipeline-step'
          if (i < d.currentPhase) cls += ' completed'
          if (i === d.currentPhase) cls += ' active'
          return (
            <div className={cls} key={i} onClick={() => setField('aiSaas.currentPhase', i)} style={{ cursor: 'pointer' }}>
              {phase.name}
            </div>
          )
        })}
      </div>

      {d.phases.map((phase, i) => (
        <div className="card" key={i}>
          <div className="row-between" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>
              Phase {i + 1} — <InlineEdit value={phase.name} onSave={v => {
                const updated = [...d.phases]
                updated[i] = { ...updated[i], name: v }
                setField('aiSaas.phases', updated)
              }} />
            </h2>
            <span className="mono small muted">
              {phase.tasks.filter(t => t.completed).length}/{phase.tasks.length}
            </span>
          </div>
          <TaskList tasks={phase.tasks}
            onToggle={id => toggleTask(`aiSaas.phases.${i}.tasks`, id)}
            onDelete={id => removeFromArray(`aiSaas.phases.${i}.tasks`, id)}
            onUpdate={(id, updates) => updateInArray(`aiSaas.phases.${i}.tasks`, id, updates)}
          />
          <div style={{ marginTop: 8 }}>
            <AddTaskForm onAdd={task => addToArray(`aiSaas.phases.${i}.tasks`, task)} />
          </div>
        </div>
      ))}

      <div className="card">
        <h2>Weekly Goals</h2>
        <GoalList goals={d.weeklyGoals} path="aiSaas.weeklyGoals" setField={setField} />
      </div>

      <div className="card">
        <h2>Notes</h2>
        <AddNoteForm onAdd={note => setField('aiSaas.notes', [note, ...d.notes])} />
        <div style={{ marginTop: 8 }}>
          <LogEntries entries={d.notes}
            onDelete={i => setField('aiSaas.notes', d.notes.filter((_, idx) => idx !== i))}
            onUpdate={(i, text) => setField('aiSaas.notes', d.notes.map((e, idx) => idx === i ? { ...e, text } : e))}
          />
        </div>
      </div>

      <NotionLinks path="aiSaas.notionLinks" />
    </div>
  )
}
