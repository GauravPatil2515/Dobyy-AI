import { useState, useRef, useEffect } from 'react'

const CHIPS = [
  'Royal Stewart', 'Black Watch', 'red and navy plaid',
  'autumn forest tartan', 'ocean blues and white',
  'make it finer', 'make it bolder', 'plain weave',
  'more repeats', 'pastel spring colors'
]
const WEAVE_LABELS = {
  twill22:'2/2 twill', twill21:'2/1 twill',
  plain:'plain weave', satin5:'5-end satin'
}

export default function ChatPanel({ state, onPrompt, loading }) {
  const [input,  setInput]  = useState('')
  const [msgs,   setMsgs]   = useState([{
    role: 'ai',
    text: 'Hello! I\'m Dobby, your AI fabric designer.\n\nDescribe any tartan or fabric — I\'ll design it live. Try "autumn forest tartan" or "ocean blues and white" ✦'
  }])
  const [intent, setIntent] = useState('')
  const msgsRef = useRef(null)

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  const send = async (text) => {
    if (!text.trim() || loading) return
    setMsgs(m => [...m, { role:'user', text }])
    setInput('')

    // Show typing indicator
    setMsgs(m => [...m, { role:'ai', text:'...', isTyping: true }])

    await onPrompt(text, ({ reply, intent }) => {
      setMsgs(m => {
        const filtered = m.filter(msg => !msg.isTyping)
        return [...filtered, { role:'ai', text: reply }]
      })
      setIntent(intent)
    })
  }

  const tsPercent  = ((state.ts - 4) / 18 * 100).toFixed(0)
  const repPercent = ((state.reps - 1) / 5 * 100).toFixed(0)

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">Design Assistant</div>
        <div className="chat-sub">
          {loading ? '⟳ Generating design…' : 'Powered by Groq · llama3-70b'}
        </div>
      </div>

      <div className="live-feed">
        <div className="feed-title">Live State</div>
        <div className="feed-body">
          <div className="feed-row">
            <span className="feed-key">Colors</span>
            <div className="feed-dots">
              {state.sett.map((s,i) => (
                <div key={i} className="feed-dot"
                  style={{background:s.c}} title={`${s.n}t`}/>
              ))}
            </div>
          </div>
          <div className="feed-row">
            <span className="feed-key">Weave</span>
            <span className="feed-val">{WEAVE_LABELS[state.weave]}</span>
          </div>
          <div className="feed-row">
            <span className="feed-key">Thread</span>
            <div className="feed-bar">
              <div className="feed-fill" style={{width:`${tsPercent}%`}}/>
            </div>
            <span className="feed-val">{state.ts}px</span>
          </div>
          <div className="feed-row">
            <span className="feed-key">Repeats</span>
            <div className="feed-bar">
              <div className="feed-fill" style={{width:`${repPercent}%`}}/>
            </div>
            <span className="feed-val">{state.reps}×</span>
          </div>
        </div>
      </div>

      {intent && <div className="intent-chip">↳ {intent}</div>}

      <div className="chat-msgs" ref={msgsRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`bubble${m.isTyping ? ' typing' : ''}`}>
              {m.isTyping ? (
                <span className="dots">
                  <span/><span/><span/>
                </span>
              ) : m.text}
            </div>
          </div>
        ))}
      </div>

      <div className="chips">
        {CHIPS.map(c => (
          <button key={c} className="chip"
            disabled={loading}
            onClick={() => send(c)}>{c}</button>
        ))}
      </div>

      <div className="chat-input">
        <div className="input-wrap">
          <textarea
            value={input}
            rows={1}
            placeholder={loading ? 'Generating…' : 'Describe your fabric…'}
            disabled={loading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key==='Enter' && !e.shiftKey) {
                e.preventDefault()
                send(input)
              }
            }}/>
          <button className="btn-send"
            disabled={loading}
            onClick={() => send(input)}>
            {loading ? (
              <svg viewBox="0 0 24 24" width="12" height="12"
                fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"
                  strokeDasharray="30" strokeDashoffset="10">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" width="12" height="12">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
