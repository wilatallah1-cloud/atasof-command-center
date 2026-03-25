import { useState } from 'react'
import { useData } from '../context/DataContext'

export default function NotionLinks({ path }) {
  const { data, setField } = useData()
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')

  // Navigate to the notion links array via path
  const links = path.split('.').reduce((obj, key) => {
    const idx = Number(key)
    return Number.isNaN(idx) ? obj[key] : obj[idx]
  }, data) || []

  function add(e) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    const finalUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`
    const newLink = { id: `notion-${Date.now()}`, title: title.trim(), url: finalUrl }
    setField(path, [...links, newLink])
    setTitle('')
    setUrl('')
  }

  function remove(id) {
    setField(path, links.filter(l => l.id !== id))
  }

  return (
    <div className="card notion-section">
      <h2 style={{ margin: 0, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 20, height: 20, borderRadius: 4,
          background: 'rgba(255,255,255,0.08)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'var(--text-muted)'
        }}>N</span>
        Notion Pages
      </h2>
      {links.length > 0 ? (
        <div className="stack-sm" style={{ marginBottom: 10 }}>
          {links.map(link => (
            <div className="notion-link-row" key={link.id}>
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="notion-link">
                <span className="notion-link-title">{link.title}</span>
                <span className="notion-link-url">{link.url}</span>
              </a>
              <button className="task-delete" onClick={() => remove(link.id)} title="Remove">×</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">No pages linked yet.</div>
      )}
      <form onSubmit={add} className="add-form">
        <input className="input" placeholder="Page title" value={title} onChange={e => setTitle(e.target.value)} style={{ flex: 1 }} />
        <input className="input" placeholder="Notion URL" value={url} onChange={e => setUrl(e.target.value)} style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12 }} />
        <button type="submit" className="btn btn-outline" disabled={!title.trim() || !url.trim()}>Add</button>
      </form>
    </div>
  )
}
