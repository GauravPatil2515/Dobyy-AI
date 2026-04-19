import { useEffect, useRef, useState } from 'react'
import { expandSett } from '../utils/weaveUtils.js'
import { h2r, blend } from '../utils/colorUtils.js'
import { PRESETS } from '../data/presets.js'

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
  const bgRef = useRef(null)
  const [out, setOut] = useState(false)

  const dismiss = () => {
    setOut(true)
    setTimeout(() => {
      onEnter()
    }, 700)
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

  return (
    <div className={`landing${out?' out':''}`}>
      <div className="landing-bg"><canvas ref={bgRef}/></div>
      <div className="lshine"/>
      <div className="lshine"/>
      <div className="lshine"/>
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
          An AI-powered tartan &amp; fabric design tool.<br/>
          Describe your vision. Watch the loom respond.
        </p>
        <div className="l-swatches">
          {SWATCHES.map(c => (
            <div key={c} className="l-sw" style={{background:c}}/>
          ))}
        </div>
        <div className="l-cta">
          <button className="l-btn" onClick={dismiss}>Enter Studio</button>
          <div className="l-btn-sub">Press any key to continue</div>
        </div>
        <button
          onClick={dismiss}
          style={{
            marginTop: 16,
            background: 'none',
            border: 'none',
            color: 'rgba(255,240,200,.25)',
            fontSize: 10,
            letterSpacing: 2,
            cursor: 'pointer',
            textTransform: 'uppercase'
          }}>
          Skip intro
        </button>
      </div>
      <div className="l-credit">Dobby Studio · AI Fabric Design · 2026</div>
    </div>
  )
}
