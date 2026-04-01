import { useState, useEffect } from 'react'
import { useData } from '../context/DataContext'
import PersonToggle from '../components/tasks/PersonToggle'
import KanbanBoard from '../components/tasks/KanbanBoard'
import ScheduleView from '../components/tasks/ScheduleView'
import AddTaskBar from '../components/tasks/AddTaskBar'
import TaskModal from '../components/tasks/TaskModal'

const SECTION_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'outreach', label: 'Outreach' },
  { value: 'clients', label: 'Clients' },
  { value: 'ai-app', label: 'AI App' },
  { value: 'coaching', label: 'Coaching' },
  { value: 'content', label: 'Content' },
]

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function isToday(dateStr) {
  return dateStr === new Date().toISOString().split('T')[0]
}

export default function Tasks() {
  const { data, addToArray, removeFromArray, updateInArray, setField } = useData()
  const [tab, setTab] = useState('kanban')
  const [person, setPerson] = useState('all')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [editingTask, setEditingTask] = useState(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const tasks = data.tasks || []
  const settings = data.tasksSettings || {
    workStart: '10:00', workEnd: '18:00',
    peakStart: '11:00', peakEnd: '13:30',
    lastScheduleReset: '',
  }

  // Daily schedule reset
  useEffect(() => {
    if (!data.tasksSettings) return
    const today = new Date().toISOString().split('T')[0]
    if (settings.lastScheduleReset !== today) {
      const stale = tasks.filter(t => t.scheduledTime && t.status !== 'done' && t.dueDate && t.dueDate < today)
      if (stale.length > 0) {
        stale.forEach(t => {
          updateInArray('tasks', t.id, { scheduledTime: null })
        })
      }
      setField('tasksSettings.lastScheduleReset', today)
    }
  }, [])

  // Filter tasks by date, person, and section
  const filtered = tasks.filter(t => {
    if (t.dueDate !== selectedDate) return false
    if (person !== 'all') {
      if (person === 'william' && t.assignee !== 'William' && t.assignee !== 'Both') return false
      if (person === 'fadi' && t.assignee !== 'Fadi' && t.assignee !== 'Both') return false
    }
    if (sectionFilter !== 'all' && t.section !== sectionFilter) return false
    return true
  })

  function handleStatusChange(taskId, newStatus) {
    const updates = { status: newStatus }
    if (newStatus === 'done') updates.completedAt = new Date().toISOString()
    else updates.completedAt = null
    updateInArray('tasks', taskId, updates)
  }

  function handleSchedule(taskId, time) {
    updateInArray('tasks', taskId, { scheduledTime: time })
  }

  function handleAddTask(task) {
    addToArray('tasks', { ...task, dueDate: selectedDate })
  }

  function handleDeleteTask(taskId) {
    removeFromArray('tasks', taskId)
  }

  function handleEditSave(taskId, updates) {
    updateInArray('tasks', taskId, updates)
  }

  function navigateDate(offset) {
    const d = new Date(selectedDate + 'T12:00:00')
    d.setDate(d.getDate() + offset)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const doneCount = filtered.filter(t => t.status === 'done').length

  return (
    <div className="stack">
      {/* Header */}
      <div className="tasks-header">
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>Tasks</h2>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {doneCount}/{filtered.length} done
          </span>
        </div>
        <PersonToggle value={person} onChange={setPerson} />
      </div>

      {/* Date navigator */}
      <div className="date-navigator">
        <button className="btn btn-ghost" onClick={() => navigateDate(-1)}>←</button>
        <button
          className={`btn ${isToday(selectedDate) ? 'btn-accent' : 'btn-outline'}`}
          onClick={() => setSelectedDate(todayStr)}
          style={{ minWidth: 60 }}
        >
          Today
        </button>
        <span className="date-navigator-label">{formatDateLabel(selectedDate)}</span>
        <button className="btn btn-ghost" onClick={() => navigateDate(1)}>→</button>
      </div>

      {/* Section filter chips */}
      <div className="section-chips">
        {SECTION_OPTIONS.map(s => (
          <button
            key={s.value}
            className={`section-chip${sectionFilter === s.value ? ' active' : ''}`}
            onClick={() => setSectionFilter(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tab toggle */}
      <div className="tab-toggle">
        <button className={`tab-toggle-btn${tab === 'kanban' ? ' active' : ''}`} onClick={() => setTab('kanban')}>
          Kanban
        </button>
        <button className={`tab-toggle-btn${tab === 'schedule' ? ' active' : ''}`} onClick={() => setTab('schedule')}>
          Schedule
        </button>
      </div>

      {/* Content */}
      {tab === 'kanban' ? (
        <KanbanBoard
          tasks={filtered}
          onStatusChange={handleStatusChange}
          onEdit={setEditingTask}
          onDelete={handleDeleteTask}
        />
      ) : (
        <ScheduleView
          tasks={filtered}
          settings={settings}
          onSchedule={handleSchedule}
          onStatusChange={handleStatusChange}
          onEdit={setEditingTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Add task bar */}
      <AddTaskBar onAdd={handleAddTask} defaultDate={selectedDate} />

      {/* Edit modal */}
      <TaskModal
        task={editingTask}
        onSave={handleEditSave}
        onClose={() => setEditingTask(null)}
      />
    </div>
  )
}
