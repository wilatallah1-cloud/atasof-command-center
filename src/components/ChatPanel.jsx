import { useState, useRef, useEffect } from 'react'
import { useData } from '../context/DataContext'

export default function ChatPanel({ open, onClose }) {
  const { data, applyOperations } = useData()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('atasof-api-key') || '')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function saveKey(key) {
    setApiKey(key)
    localStorage.setItem('atasof-api-key', key)
    setShowKeyInput(false)
  }

  async function send() {
    if (!input.trim() || loading) return
    if (!apiKey) {
      setShowKeyInput(true)
      return
    }

    const userMsg = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          message: userMsg.content,
          history: messages.slice(-10),
          currentData: data
        })
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'API request failed')
      }

      const result = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: result.text }])

      if (result.operations && result.operations.length > 0) {
        applyOperations(result.operations)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${err.message}. Make sure your API key is set and the Netlify function is deployed.`
      }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  if (!open) return null

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-panel" onClick={e => e.stopPropagation()}>
        <div className="chat-header">
          <span className="mono" style={{ fontSize: 13, fontWeight: 600 }}>BRIEF CLAUDE</span>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn-ghost small" onClick={() => setShowKeyInput(!showKeyInput)}>
              {apiKey ? 'Key set' : 'Set API key'}
            </button>
            <button className="chat-close" onClick={onClose}>×</button>
          </div>
        </div>

        {showKeyInput && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
            <p className="small muted" style={{ marginBottom: 8 }}>
              Enter your Anthropic API key from console.anthropic.com
            </p>
            <div className="row" style={{ gap: 8 }}>
              <input
                type="password"
                className="input"
                placeholder="sk-ant-..."
                defaultValue={apiKey}
                onKeyDown={e => { if (e.key === 'Enter') saveKey(e.target.value) }}
                style={{ fontSize: 12 }}
              />
              <button
                className="btn btn-accent"
                style={{ fontSize: 12, padding: '8px 12px' }}
                onClick={e => saveKey(e.target.previousSibling.value)}
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="chat-messages">
          {messages.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <p className="muted small">Tell Claude what happened today.</p>
              <p className="dim small" style={{ marginTop: 8 }}>
                "Mark the outreach DMs task as done, add a note that we got 2 replies, and update leads to 36."
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg ${msg.role}`}>
              <div className="chat-msg-label mono small">
                {msg.role === 'user' ? 'You' : 'Claude'}
              </div>
              <div className="chat-msg-text">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg assistant">
              <div className="chat-msg-label mono small">Claude</div>
              <div className="chat-msg-text dim">Thinking...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            className="input"
            placeholder="Tell Claude what to update..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            style={{ resize: 'none', minHeight: 'auto' }}
          />
          <button
            className="btn btn-accent"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ alignSelf: 'flex-end' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
