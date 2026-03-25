import { useState } from 'react'
import { useData } from '../context/DataContext'
import LogEntries from '../components/LogEntries'
import { AddNoteForm } from '../components/AddItemForm'
import InlineEdit from '../components/InlineEdit'
import { InlineNumberEdit } from '../components/InlineEdit'
import { GoalList } from '../components/EditableGoal'
import NotionLinks from '../components/NotionLinks'

export default function YouTube() {
  const { data, setField } = useData()
  const d = data.youtube

  const columns = [
    { key: 'ideas', label: 'Ideas' },
    { key: 'scripted', label: 'Scripted' },
    { key: 'filmed', label: 'Filmed' },
    { key: 'edited', label: 'Edited' },
    { key: 'published', label: 'Published' },
  ]

  const [newVideo, setNewVideo] = useState('')

  function addVideoIdea(e) {
    e.preventDefault()
    if (!newVideo.trim()) return
    setField('youtube.pipeline.ideas', [...d.pipeline.ideas, { id: `yt-${Date.now()}`, title: newVideo.trim() }])
    setNewVideo('')
  }

  function moveVideo(fromCol, videoId, toCol) {
    const fromItems = d.pipeline[fromCol]
    const item = fromItems.find(v => v.id === videoId)
    if (!item) return
    setField(`youtube.pipeline.${fromCol}`, fromItems.filter(v => v.id !== videoId))
    setField(`youtube.pipeline.${toCol}`, [...d.pipeline[toCol], item])
  }

  function deleteVideo(col, videoId) {
    setField(`youtube.pipeline.${col}`, d.pipeline[col].filter(v => v.id !== videoId))
  }

  function getNextCol(col) {
    const idx = columns.findIndex(c => c.key === col)
    return idx < columns.length - 1 ? columns[idx + 1].key : null
  }
  function getPrevCol(col) {
    const idx = columns.findIndex(c => c.key === col)
    return idx > 0 ? columns[idx - 1].key : null
  }

  return (
    <div className="stack">
      <div className="section-header">
        <h1><InlineEdit value={d.channelName} onSave={v => setField('youtube.channelName', v)} /></h1>
        <p className="section-desc">
          <InlineEdit value={d.niche} onSave={v => setField('youtube.niche', v)} />
        </p>
      </div>

      <div className="grid-3">
        <div className="card stat-box">
          <div className="stat-value">
            <InlineNumberEdit value={d.stats.subscribers} onSave={v => setField('youtube.stats.subscribers', v)} />
          </div>
          <div className="stat-label">Subscribers</div>
        </div>
        <div className="card stat-box">
          <div className="stat-value">
            <InlineNumberEdit value={d.stats.videosPublished} onSave={v => setField('youtube.stats.videosPublished', v)} />
          </div>
          <div className="stat-label">Videos Published</div>
        </div>
        <div className="card stat-box">
          <div className="stat-value">
            <InlineNumberEdit value={d.stats.avgViews} onSave={v => setField('youtube.stats.avgViews', v)} />
          </div>
          <div className="stat-label">Avg Views</div>
        </div>
      </div>

      <div className="card">
        <h2>Video Pipeline</h2>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns.length}, 1fr)`, gap: 8, marginTop: 8 }}>
          {columns.map(col => (
            <div className="board-column" key={col.key}>
              <div className="board-column-title">
                {col.label}
                <span style={{ marginLeft: 6, opacity: 0.5 }}>{d.pipeline[col.key].length}</span>
              </div>
              {d.pipeline[col.key].map(item => (
                <div className="board-item" key={item.id}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{item.title}</div>
                  <div className="row" style={{ gap: 4 }}>
                    {getPrevCol(col.key) && <button className="btn-ghost small" onClick={() => moveVideo(col.key, item.id, getPrevCol(col.key))}>←</button>}
                    {getNextCol(col.key) && <button className="btn-ghost small" onClick={() => moveVideo(col.key, item.id, getNextCol(col.key))}>→</button>}
                    <button className="task-delete" onClick={() => deleteVideo(col.key, item.id)} style={{ marginLeft: 'auto' }}>×</button>
                  </div>
                </div>
              ))}
              {d.pipeline[col.key].length === 0 && (
                <div className="small dim" style={{ padding: '8px 0', textAlign: 'center' }}>Empty</div>
              )}
            </div>
          ))}
        </div>
        <form onSubmit={addVideoIdea} className="add-form" style={{ marginTop: 12 }}>
          <input className="input" placeholder="Add video idea..." value={newVideo} onChange={e => setNewVideo(e.target.value)} style={{ flex: 1 }} />
          <button type="submit" className="btn btn-accent" disabled={!newVideo.trim()}>Add</button>
        </form>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Weekly Goals</h2>
          <GoalList goals={d.weeklyGoals} path="youtube.weeklyGoals" setField={setField} />
        </div>
        <div className="card">
          <h2>Upload Schedule</h2>
          <p className="mono small" style={{ color: 'var(--accent)' }}>
            <InlineEdit value={d.uploadSchedule} onSave={v => setField('youtube.uploadSchedule', v)} />
          </p>
        </div>
      </div>

      <div className="card">
        <h2>Notes</h2>
        <AddNoteForm onAdd={note => setField('youtube.notes', [note, ...d.notes])} />
        <div style={{ marginTop: 8 }}>
          <LogEntries entries={d.notes}
            onDelete={i => setField('youtube.notes', d.notes.filter((_, idx) => idx !== i))}
            onUpdate={(i, text) => setField('youtube.notes', d.notes.map((e, idx) => idx === i ? { ...e, text } : e))}
          />
        </div>
      </div>

      <NotionLinks path="youtube.notionLinks" />
    </div>
  )
}
