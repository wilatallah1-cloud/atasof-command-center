import { useState, useRef, useEffect } from 'react'

export default function InlineEdit({ value, onSave, className = '', tag: Tag = 'span', inputStyle = {} }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const ref = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  function save() {
    setEditing(false)
    if (draft.trim() !== value) onSave(draft.trim())
  }

  if (editing) {
    return (
      <input
        ref={ref}
        className="input inline-edit-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(value); setEditing(false) } }}
        style={{ padding: '2px 6px', fontSize: 'inherit', ...inputStyle }}
      />
    )
  }

  return (
    <Tag
      className={`${className} inline-editable`}
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {value}
    </Tag>
  )
}

export function InlineNumberEdit({ value, onSave, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const ref = useRef(null)

  useEffect(() => { setDraft(String(value)) }, [value])
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])

  function save() {
    setEditing(false)
    const num = Number(draft)
    if (!isNaN(num) && num !== value) onSave(num)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        className="input inline-edit-input"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setDraft(String(value)); setEditing(false) } }}
        style={{ padding: '2px 6px', fontSize: 'inherit', width: 80, textAlign: 'center' }}
      />
    )
  }

  return (
    <span className={`${className} inline-editable`} onClick={() => setEditing(true)} title="Click to edit">
      {value}
    </span>
  )
}
