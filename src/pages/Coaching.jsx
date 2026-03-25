import { useData } from '../context/DataContext'
import TaskList from '../components/TaskList'
import LogEntries from '../components/LogEntries'
import { AddTaskForm, AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import { GoalList } from '../components/EditableGoal'
import NotionLinks from '../components/NotionLinks'

export default function Coaching() {
  const { data, setField, addToArray, removeFromArray, updateInArray, toggleTask } = useData()
  const d = data.coaching

  return (
    <div className="stack">
      <div className="section-header">
        <h1>Dad's Coaching Business</h1>
        <p className="section-desc">
          <InlineEdit value={d.description} onSave={v => setField('coaching.description', v)} />
        </p>
      </div>

      <div className="pipeline">
        {d.phases.map((phase, i) => {
          let cls = 'pipeline-step'
          if (i < d.currentPhase) cls += ' completed'
          if (i === d.currentPhase) cls += ' active'
          return (
            <div className={cls} key={i} onClick={() => setField('coaching.currentPhase', i)} style={{ cursor: 'pointer' }}>
              <InlineEdit value={phase} onSave={v => {
                const updated = [...d.phases]
                updated[i] = v
                setField('coaching.phases', updated)
              }} />
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2>Tasks</h2>
        <TaskList tasks={d.tasks}
          onToggle={id => toggleTask('coaching.tasks', id)}
          onDelete={id => removeFromArray('coaching.tasks', id)}
          onUpdate={(id, updates) => updateInArray('coaching.tasks', id, updates)}
        />
        <div style={{ marginTop: 8 }}>
          <AddTaskForm onAdd={task => addToArray('coaching.tasks', task)} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Weekly Goals</h2>
          <GoalList goals={d.weeklyGoals} path="coaching.weeklyGoals" setField={setField} />
        </div>

        <div className="card">
          <h2>Monthly Revenue Goals</h2>
          <GoalList goals={d.monthlyRevenueGoals} path="coaching.monthlyRevenueGoals" setField={setField} />
        </div>
      </div>

      <div className="card">
        <h2>Daily Log</h2>
        <AddNoteForm onAdd={note => setField('coaching.log', [note, ...d.log])} placeholder="Add log entry..." />
        <div style={{ marginTop: 8 }}>
          <LogEntries entries={d.log}
            onDelete={i => setField('coaching.log', d.log.filter((_, idx) => idx !== i))}
            onUpdate={(i, text) => setField('coaching.log', d.log.map((e, idx) => idx === i ? { ...e, text } : e))}
          />
        </div>
      </div>

      <NotionLinks path="coaching.notionLinks" />
    </div>
  )
}
