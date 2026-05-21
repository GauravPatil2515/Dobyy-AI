// ChatPanel — chat UI with loading lock, command router integration, and image analysis.
import { useState, useRef, useEffect } from 'react'
import { useAuth }         from '../contexts/AuthContext.jsx'
import { useSubscription } from '../contexts/SubscriptionContext.jsx'
import { processCommand }  from '../services/chatService.js'
import { fileToBase64, analyzeImageWithGroq, buildAnalysisMessage } from '../utils/imageAnalyzer'
import { t, getLang }      from '../utils/i18n.js'

const WEAVE_LABELS = {
  twill22:'2/2 Twill', twill21:'2/1 Twill',
  plain:'Plain Weave', satin5:'5-End Satin',
  twill31:'3/1 Twill', basket2:'Basket Weave', hopsack:'Hopsack'
}

function getContextChips(state) {
  const weaveChips = []
  if (state.weave !== 'plain')   weaveChips.push('switch to plain weave')
  if (state.weave !== 'twill22') weaveChips.push('2/2 twill')
  if (state.weave !== 'satin5')  weaveChips.push('satin weave')
  const settChips = []
  if (state.reps < 6)           settChips.push('more repeats')
  if (state.ts > 6)             settChips.push('make it finer')
  if (state.ts < 16)            settChips.push('make it bolder')
  if (state.sett.length < 6)    settChips.push('add more stripes')
  const toneChips  = ['darker tones', 'lighter tones', 'muted palette', 'more contrast']
  const quickDesign = ['Royal Stewart', 'Black Watch', 'shirting', 'surprise me']
  return [...settChips.slice(0,2), ...weaveChips.slice(0,1), ...toneChips.slice(0,2), ...quickDesign.slice(0,2)].slice(0, 9)
}

/**
 * @param {{ state: import('../domain/fabricTypes.js').FabricState, dispatch: Function, loading: boolean, onLimitExceeded: Function, remainingCalls: number, isPro: boolean }} props
 */
export default function ChatPanel({ state, dispatch, loading: _loading, onLimitExceeded, remainingCalls, isPro }) {
  const { isAuthenticated }              = useAuth()
  const { canMakeApiCall, incrementApiCall } = useSubscription()
  const [input,    setInput]    = useState('')
  const [isSending, setIsSending] = useState(false)  // FIX: loading lock prevents double-submit
  const [lang,     setLangState] = useState(getLang())
  const [intent,   setIntent]   = useState('')
  const [msgs, setMsgs] = useState([{
    role: 'ai',
    text: "Hello! I'm Dobby, your AI fabric designer.\n\nDescribe any tartan or fabric — I'll design it live. Try \"autumn forest tartan\" or \"ocean blues\" ❖"
  }])
  const msgsRef    = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const onLangChange = (e) => setLangState(e.detail)
    window.addEventListener('dobby-lang-change', onLangChange)
    return () => window.removeEventListener('dobby-lang-change', onLangChange)
  }, [])

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  const chatHistory = useRef([])   // keep LLM message history separate from display msgs

  const send = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return   // FIX: hard lock while request in-flight

    if (!canMakeApiCall()) {
      setMsgs(m => [...m, { role:'user', text: trimmed }, {
        role:'ai', text: "You've reached your daily limit of 5 free designs. Upgrade to Pro for unlimited designs! ✨"
      }])
      setInput('')
      onLimitExceeded?.()
      return
    }

    setMsgs(m => [...m, { role:'user', text: trimmed }])
    setInput('')
    setIsSending(true)
    setMsgs(m => [...m, { role:'ai', text:'...', isTyping: true }])
    await incrementApiCall()

    // Update LLM chat history (last 10 turns)
    chatHistory.current = [...chatHistory.current, { role:'user', content: trimmed }].slice(-10)

    // FIX: use chatService.processCommand — rule engine first, LLM if needed
    const result = await processCommand(trimmed, state, chatHistory.current)

    if (result.ok) {
      dispatch({ type: 'APPLY', newState: result.data.state })
      chatHistory.current = [...chatHistory.current,
        { role:'assistant', content: result.data.reply }
      ].slice(-10)
      setMsgs(m => {
        const filtered = m.filter(msg => !msg.isTyping)
        return [...filtered, { role:'ai', text: result.data.reply }]
      })
      setIntent(result.data.intent || '')
    } else {
      // Show typed error message from chatService
      setMsgs(m => {
        const filtered = m.filter(msg => !msg.isTyping)
        return [...filtered, { role:'ai', text: result.message || 'Something went wrong.' }]
      })
      if (result.errorCode === 'RATE_LIMIT') onLimitExceeded?.()
    }

    setIsSending(false)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file || isSending) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const dataUrl = event.target?.result
        setMsgs(m => [...m, { role:'user', text:'📷 Analyzing fabric…', image: dataUrl }])
        setIsSending(true)
        setMsgs(m => [...m, { role:'ai', text:'Analyzing fabric pattern…', isTyping: true }])

        const base64 = await fileToBase64(file)
        const result = await analyzeImageWithGroq(base64)

        if (result.sett?.length > 0) {
          dispatch({
            type: 'APPLY',
            newState: { ...state, sett: result.sett, weave: result.weave || state.weave, activePreset: -1 }
          })
        }

        const analysisMsg = buildAnalysisMessage(result.sett, result.weave, result.confidence, result.description)
        setMsgs(m => {
          const filtered = m.filter(msg => !msg.isTyping)
          return [...filtered, { role:'ai', text: analysisMsg }]
        })
        setIntent('image analysis')
      } catch (err) {
        console.error('[ChatPanel] Image upload error:', err)
        setMsgs(m => {
          const filtered = m.filter(msg => !msg.isTyping)
          return [...filtered, { role:'ai', text: '❌ Image analysis failed. Try a clearer photo of the fabric.' }]
        })
      } finally {
        setIsSending(false)
      }
    }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const isLoading = isSending
  const tsPercent  = ((state.ts  - 4)  / 18 * 100).toFixed(0)
  const repPercent = ((state.reps - 1) / 11 * 100).toFixed(0)
  const chips = getContextChips(state)

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-title">Design Assistant</div>
        <div className="chat-sub">
          {isLoading ? '⟳ Generating design…' : (
            <>
              Powered by Groq · llama3-70b
              {!isPro && (
                <span style={{
                  marginLeft:8, padding:'2px 8px',
                  background: remainingCalls <= 1 ? '#fee2e2' : '#fef3c7',
                  color:      remainingCalls <= 1 ? '#dc2626' : '#92400e',
                  borderRadius:4, fontSize:'0.75rem', fontWeight:500
                }}>
                  {remainingCalls} {t('chat.remaining')}
                </span>
              )}
              {isPro && (
                <span style={{
                  marginLeft:8, padding:'2px 8px',
                  background:'#d1fae5', color:'#065f46',
                  borderRadius:4, fontSize:'0.75rem', fontWeight:500
                }}>PRO</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Live State Feed */}
      <div className="live-feed">
        <div className="feed-title">Live State</div>
        <div className="feed-body">
          <div className="feed-row">
            <span className="feed-key">Colors</span>
            <div className="feed-dots">
              {state.sett.map((s, i) => (
                <div key={i} className="feed-dot" style={{ background: s.c }} title={`${s.n}t`} />
              ))}
            </div>
          </div>
          <div className="feed-row">
            <span className="feed-key">{t('sidebar.weave')}</span>
            <span className="feed-val">{WEAVE_LABELS[state.weave]}</span>
          </div>
          <div className="feed-row">
            <span className="feed-key">{t('sidebar.ts')}</span>
            <div className="feed-bar"><div className="feed-fill" style={{ width:`${tsPercent}%` }}/></div>
            <span className="feed-val">{state.ts}px</span>
          </div>
          <div className="feed-row">
            <span className="feed-key">{t('sidebar.reps')}</span>
            <div className="feed-bar"><div className="feed-fill" style={{ width:`${repPercent}%` }}/></div>
            <span className="feed-val">{state.reps}×</span>
          </div>
        </div>
      </div>

      {intent && <div className="intent-chip">↳ {intent}</div>}

      {/* Messages */}
      <div className="chat-msgs" ref={msgsRef}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className={`bubble${m.isTyping ? ' typing' : ''}`}>
              {m.isTyping ? (
                <span className="dots"><span/><span/><span/></span>
              ) : (
                <>
                  {m.image && (
                    <img src={m.image} alt="uploaded fabric"
                      style={{ maxWidth:'100%', maxHeight:160, borderRadius:6, marginBottom:6, objectFit:'cover' }} />
                  )}
                  {m.text}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Context chips — FIX: wired directly to processCommand via send() */}
      <div className="chips">
        {chips.map(c => (
          <button key={c} className="chip" disabled={isLoading} onClick={() => send(c)}>{c}</button>
        ))}
      </div>

      {/* Input area */}
      <div className="chat-input">
        <div className="input-wrap">
          <textarea
            value={input}
            rows={1}
            placeholder={isLoading ? 'Generating…' : t('chat.placeholder')}
            disabled={isLoading}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) }
            }}
          />
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display:'none' }} />
          <button className="btn-attach" disabled={isLoading}
            onClick={() => fileInputRef.current?.click()} title="Upload fabric image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </button>
          <button className="btn-send" disabled={isLoading} onClick={() => send(input)}>
            {isLoading ? (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeDasharray="30" strokeDashoffset="10">
                  <animateTransform attributeName="transform" type="rotate"
                    from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
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
