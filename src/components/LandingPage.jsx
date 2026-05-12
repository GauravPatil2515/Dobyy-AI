import { useEffect, useRef, useState } from 'react'
import { expandSett } from '../utils/weaveUtils.js'
import { h2r, blend } from '../utils/colorUtils.js'
import { PRESETS } from '../data/presets.js'
import { setLang, getLang, SUPPORTED_LANGS } from '../utils/i18n.js'

function drawBg(canvas) {
  const W = window.innerWidth * 1.1
  const H = window.innerHeight * 1.1
  canvas.width  = W
  canvas.height = H
  const ctx     = canvas.getContext('2d')
  const threads = expandSett(PRESETS[0].sett)
  const L       = threads.length
  const ts      = 14
  const total   = Math.ceil(Math.max(W, H) / ts) + L
  for(let i=0; i<total; i++) {
    for(let j=0; j<total; j++) {
      const col = blend(
        h2r(threads[j%L]),
        h2r(threads[i%L]),
        (i+j)%4<2 ? 0.70 : 0.30
      )
      ctx.fillStyle = `rgb(${col.r},${col.g},${col.b})`
      ctx.fillRect(j*ts, i*ts, ts, ts)
    }
  }
}

const SWATCHES = [
  '#cc1122','#111111','#006633','#ffffff','#ffcc00',
  '#003399','#c8a96e','#2a4a1a','#660099','#cc6600'
]

export default function LandingPage({ onEnter }) {
  const bgRef  = useRef(null)
  const [out, setOut]   = useState(false)
  const [lang, setLangState] = useState(getLang())

  const dismiss = () => {
    setOut(true)
    setTimeout(() => onEnter(), 700)
  }

  const handleLang = (code) => {
    setLang(code)
    setLangState(code)
  }

  useEffect(() => {
    if (bgRef.current) drawBg(bgRef.current)
    const onResize = () => bgRef.current && drawBg(bgRef.current)
    const onKey    = () => dismiss()
    window.addEventListener('resize',  onResize)
    window.addEventListener('keydown', onKey, { once: true })
    return () => {
      window.removeEventListener('resize',  onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  // Labels based on selected language
  const labels = {
    en: { enter: 'Enter Studio', skip: 'Skip intro', demo: '🎯 Request a Demo for your Mill', community: '🧶 Join Ravelry & Spoonflower Community', tagline: 'An AI-powered tartan & fabric design tool.' },
    hi: { enter: 'स्टूडियो में प्रवेश', skip: 'छोड़ें', demo: '🎯 अपनी मिल के लिए डेमो माँगें', community: '🧶 Ravelry & Spoonflower से जुड़ें', tagline: 'AI-संचालित कपड़ा और टार्टन डिज़ाइन टूल।' },
    gu: { enter: 'સ્ટુડિયોમાં પ્રવેશ', skip: 'છોડો', demo: '🎯 તમારી મિલ માટે ડેમો', community: '🧶 Ravelry & Spoonflower સમુદાય', tagline: 'AI-સંચાલિત કાપડ ડિઝાઇન ટૂલ।' },
  }
  const L = labels[lang] || labels.en

  return (
    <div className={`landing${out?' out':''}`}>
      <div className="landing-bg"><canvas ref={bgRef}/></div>
      <div className="lshine"/>
      <div className="lshine"/>
      <div className="lshine"/>

      {/* Language switcher — top right */}
      <div style={{
        position:'absolute', top:20, right:20,
        display:'flex', gap:6, zIndex:10
      }}>
        {SUPPORTED_LANGS.map(({ code, label, flag }) => (
          <button
            key={code}
            onClick={() => handleLang(code)}
            style={{
              background: lang === code ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.08)',
              border: lang === code ? '1px solid rgba(255,255,255,.5)' : '1px solid rgba(255,255,255,.15)',
              color:'#fff', borderRadius:6, padding:'4px 10px',
              fontSize:11, cursor:'pointer', backdropFilter:'blur(4px)',
              fontWeight: lang === code ? 700 : 400,
              transition:'all 180ms'
            }}>
            {flag} {label}
          </button>
        ))}
      </div>

      <div className="landing-inner">
        <div className="l-pre">Woven Intelligence · Est. 2026</div>
        <h1 className="l-title">Dobby</h1>
        <div className="l-sub">Studio</div>
        <div className="l-rule">
          <div className="l-rule-line"/>
          <div className="l-rule-diamond"/>
          <div className="l-rule-line"/>
        </div>
        <p className="l-desc">
          {L.tagline}<br/>
          Describe your vision. Watch the loom respond.
        </p>
        <div className="l-swatches">
          {SWATCHES.map(c => (
            <div key={c} className="l-sw" style={{background:c}}/>
          ))}
        </div>

        <div className="l-cta">
          <button className="l-btn" onClick={dismiss}>{L.enter}</button>
          <div className="l-btn-sub">Press any key to continue</div>
        </div>

        {/* B2B: Request a demo CTA — opens mailto for mill/buyer outreach */}
        <a
          href="mailto:hello@dobby.studio?subject=Demo%20Request%20—%20Mill%20Inquiry&body=Hi%2C%20I%27d%20like%20to%20request%20a%20demo%20of%20Dobby%20Studio%20for%20our%20mill.%0A%0ACompany%3A%0ALocation%3A%0ADesigners%20on%20team%3A"
          style={{
            display:'block', marginTop:12,
            color:'rgba(255,240,160,.85)', fontSize:12,
            letterSpacing:.5, textDecoration:'none',
            padding:'6px 16px', border:'1px solid rgba(255,240,160,.3)',
            borderRadius:20, background:'rgba(255,240,160,.08)',
            transition:'all 180ms',
          }}
          onMouseEnter={e => e.target.style.background='rgba(255,240,160,.18)'}
          onMouseLeave={e => e.target.style.background='rgba(255,240,160,.08)'}>
          {L.demo}
        </a>

        {/* Community links: Ravelry + Spoonflower for organic growth */}
        <div style={{ marginTop:10, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
          <a
            href="https://www.ravelry.com/groups/search#query=weaving+software&sort=members"
            target="_blank" rel="noopener noreferrer"
            style={{
              color:'rgba(255,255,255,.45)', fontSize:10,
              textDecoration:'none', letterSpacing:.5,
              border:'1px solid rgba(255,255,255,.15)',
              borderRadius:12, padding:'3px 10px',
              transition:'all 180ms',
            }}
            onMouseEnter={e => e.target.style.color='rgba(255,255,255,.85)'}
            onMouseLeave={e => e.target.style.color='rgba(255,255,255,.45)'}>
            🧶 Ravelry Community
          </a>
          <a
            href="https://www.spoonflower.com/en/forum"
            target="_blank" rel="noopener noreferrer"
            style={{
              color:'rgba(255,255,255,.45)', fontSize:10,
              textDecoration:'none', letterSpacing:.5,
              border:'1px solid rgba(255,255,255,.15)',
              borderRadius:12, padding:'3px 10px',
              transition:'all 180ms',
            }}
            onMouseEnter={e => e.target.style.color='rgba(255,255,255,.85)'}
            onMouseLeave={e => e.target.style.color='rgba(255,255,255,.45)'}>
            🌸 Spoonflower Forum
          </a>
        </div>

        <button
          onClick={dismiss}
          style={{
            marginTop:16, background:'none', border:'none',
            color:'rgba(255,240,200,.25)', fontSize:10,
            letterSpacing:2, cursor:'pointer', textTransform:'uppercase'
          }}>
          {L.skip}
        </button>
      </div>
      <div className="l-credit">Dobby Studio · AI Fabric Design · 2026</div>
    </div>
  )
}
