import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'
import { fileToBase64, analyzeImageWithGroq, buildAnalysisMessage } from '../utils/imageAnalyzer'

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

export default function ChatPanel({ state, onPrompt, loading, onLimitExceeded, remainingCalls, isPro }) {
  const { isAuthenticated } = useAuth()
  const { canMakeApiCall, incrementApiCall } = useSubscription()
  const [input,  setInput]  = useState('')
  const [msgs,   setMsgs]   = useState([{
    role: 'ai',
    text: 'Hello! I\'m Dobby, your AI fabric designer.\n\nDescribe any tartan or fabric — I\'ll design it live. Try "autumn forest tartan" or "ocean blues and white" ✦'
  }])
  const [intent, setIntent] = useState('')
  const msgsRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  const send = async (text) => {
    if (!text.trim() || loading) return
    
    // Check rate limit before sending
    if (!canMakeApiCall()) {
      setMsgs(m => [...m, { 
        role:'user', 
        text 
      }, {
        role:'ai',
        text: "You've reached your daily limit of 5 free designs. Upgrade to Pro for 100 designs per day! ✨"
      }])
      setInput('')
      onLimitExceeded?.()
      return
    }

    setMsgs(m => [...m, { role:'user', text }])
    setInput('')

    // Show typing indicator
    setMsgs(m => [...m, { role:'ai', text:'...', isTyping: true }])

    // Increment the counter
    await incrementApiCall()

    await onPrompt(text, ({ reply, intent }) => {
      setMsgs(m => {
        const filtered = m.filter(msg => !msg.isTyping)
        return [...filtered, { role:'ai', text: reply }]
      })
      setIntent(intent)
    })
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || loading) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        // Show image in chat immediately
        const dataUrl = event.target?.result
        setMsgs(m => [...m, { 
          role:'user', 
          text: '📷 Image uploaded', 
          image: dataUrl 
        }])
        
        // Show typing indicator
        setMsgs(m => [...m, { role:'ai', text:'...', isTyping: true }])

        // Resize image and send to API
        const base64 = await fileToBase64(file)
        
        const result = await analyzeImageWithGroq(base64, (progress) => {
          if (progress.error) {
            console.warn('[ChatPanel] Analysis progress:', progress)
          }
        })

        // Update sett in fabric state via onPrompt
        setMsgs(m => {
          const filtered = m.filter(msg => !msg.isTyping)
          const analysisMsg = buildAnalysisMessage(
            result.sett,
            result.weave,
            result.confidence,
            result.description
          )
          return [...filtered, { role:'ai', text: analysisMsg }]
        })

        // Apply the design to canvas
        onPrompt(
          `Analyze this fabric - extracted ${result.sett.length} colors: ${
            result.sett.map(s => s.c).join(', ')
          }. ${result.description}`,
          ({ reply, intent }) => {
            // Update fabric state with AI response
            setIntent(intent)
          }
        )
      } catch (err) {
        console.error('[ChatPanel] Image upload error:', err)
        setMsgs(m => {
          const filtered = m.filter(msg => !msg.isTyping)
          return [...filtered, { 
            role:'ai', 
            text: '❌ Image analysis failed. Try a different image.' 
          }]
        })
      }
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const tsPercent  = ((state.ts - 4) / 18 * 100).toFixed(0)
  const repPercent = ((state.reps - 1) / 5 * 100).toFixed(0)

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">Design Assistant</div>
        <div className="chat-sub">
          {loading ? '⟳ Generating design…' : (
            <>
              Powered by Groq · llama3-70b
              {!isPro && (
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 8px', 
                  background: remainingCalls <= 1 ? '#fee2e2' : '#fef3c7',
                  color: remainingCalls <= 1 ? '#dc2626' : '#92400e',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  {remainingCalls} left
                </span>
              )}
              {isPro && (
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 8px', 
                  background: '#d1fae5',
                  color: '#065f46',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}>
                  PRO
                </span>
              )}
            </>
          )}
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
              ) : (
                <>
                  {m.image && (
                    <img src={m.image} alt="uploaded fabric" 
                      style={{maxWidth: '100%', maxHeight: '160px', borderRadius: '6px', marginBottom: '6px', objectFit: 'cover'}}/>
                  )}
                  {m.text}
                </>
              )}
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{display: 'none'}}/>
          <button className="btn-attach"
            disabled={loading}
            onClick={() => fileInputRef.current?.click()}
            title="Upload fabric image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" width="12" height="12">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
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
