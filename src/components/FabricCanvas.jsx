import { useRef } from 'react'
import { useFabricRenderer } from '../hooks/useFabricRenderer.js'

const PANELS = ['fabric', 'draft', 'peg']
const WEAVE_LABELS = {
  twill22:'2/2 twill', twill21:'2/1 twill',
  plain:'plain weave', satin5:'5-end satin'
}

function exportPNG(canvas) {
  if (!canvas) return
  const link = document.createElement('a')
  link.download = `dobby-studio-${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportJSON(state) {
  const data = {
    name: 'Dobby Studio Export',
    date: new Date().toISOString(),
    sett: state.sett,
    weave: state.weave,
    ts: state.ts,
    reps: state.reps,
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const link = document.createElement('a')
  link.download = `dobby-studio-${Date.now()}.json`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function exportWIF(state) {
  const threads = []
  state.sett.forEach(s => {
    for (let i = 0; i < s.n; i++) threads.push(s.c)
  })
  const L = threads.length

  const hexToRGB = hex => {
    const n = parseInt(hex.replace('#',''), 16)
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`
  }

  const wifLines = [
    '[WIF]',
    'Version=1.1',
    'Date=' + new Date().toDateString(),
    'Developers=Dobby Studio',
    'Source Program=Dobby Studio React',
    '',
    '[CONTENTS]',
    'Color Palette=true',
    'Threading=true',
    'Tieup=true',
    '',
    '[COLOR PALETTE]',
    'Entries=' + L,
    'Form=RGB',
    'Unit=Percent',
    '',
    '[COLOR TABLE]',
    ...threads.map((c, i) => `${i+1}=${hexToRGB(c)}`),
    '',
    '[THREADING]',
    ...threads.map((_, i) => `${i+1}=${(i % 4) + 1}`),
    '',
    '[TIEUP]',
    '1=1,3',
    '2=2,4',
    '3=1,3',
    '4=2,4',
  ]

  const blob = new Blob([wifLines.join('\n')], { type: 'text/plain' })
  const link = document.createElement('a')
  link.download = `dobby-studio-${Date.now()}.wif`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

function DraftGrid({ state }) {
  const threads = []
  state.sett.forEach(s => { for(let i=0;i<s.n;i++) threads.push(s.c) })
  const L = Math.min(threads.length * state.reps, 80)
  const shafts = 4
  const cs = 10

  return (
    <div className="draft-wrap">
      <div className="draft-label">Threading Draft</div>
      <svg width={L*cs + shafts*cs + 20} height={shafts*cs + L*cs + 20}
        style={{display:'block', margin:'0 auto'}}>
        {Array.from({length:L}, (_,i) => {
          const shaft = i % shafts
          const color = threads[i % threads.length]
          return (
            <g key={`t${i}`}>
              <rect x={i*cs} y={shaft*cs} width={cs-1} height={cs-1}
                fill={color} opacity={0.9} rx={1}/>
            </g>
          )
        })}
        {Array.from({length:shafts}, (_,s) =>
          Array.from({length:shafts}, (_,t) => {
            const tied = (s === t) || (s === (t+2)%shafts)
            return tied ? (
              <rect key={`tu${s}-${t}`}
                x={L*cs + 4 + t*cs} y={s*cs}
                width={cs-1} height={cs-1}
                fill="currentColor" opacity={0.7} rx={1}/>
            ) : (
              <rect key={`tu${s}-${t}`}
                x={L*cs + 4 + t*cs} y={s*cs}
                width={cs-1} height={cs-1}
                fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" rx={1}/>
            )
          })
        )}
        {Array.from({length:L}, (_,i) =>
          Array.from({length:L}, (_,j) => {
            const up = (state.weave==='twill22') ? (i+j)%4<2
                     : (state.weave==='plain')   ? (i+j)%2
                     : (state.weave==='twill21') ? (i+j)%3<2
                     : (i*2+j)%5===0
            const wc = threads[j % threads.length]
            const fc = threads[i % threads.length]
            return (
              <rect key={`d${i}-${j}`}
                x={j*cs} y={shafts*cs + 8 + i*cs}
                width={cs-1} height={cs-1}
                fill={up ? wc : fc} opacity={0.85} rx={0.5}/>
            )
          })
        )}
      </svg>
    </div>
  )
}

function PegPlan({ state }) {
  const threads = []
  state.sett.forEach(s => { for(let i=0;i<s.n;i++) threads.push(s.c) })
  const L = Math.min(threads.length * state.reps, 60)
  const shafts = 4
  const cs = 12

  return (
    <div className="draft-wrap">
      <div className="draft-label">Peg Plan</div>
      <div style={{display:'flex', gap:2, justifyContent:'center', flexWrap:'wrap', padding:12}}>
        {Array.from({length:L}, (_,i) => (
          <div key={i} style={{display:'flex', flexDirection:'column', gap:2}}>
            {Array.from({length:shafts}, (_,s) => {
              const pegged = s === (i % shafts)
              return (
                <div key={s} style={{
                  width: cs, height: cs,
                  borderRadius: 2,
                  background: pegged ? threads[i % threads.length] : 'var(--off)',
                  border: '1px solid var(--bdr)',
                  opacity: pegged ? 1 : 0.4,
                }}/>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FabricCanvas({ state, dispatch }) {
  const canvasRef = useRef(null)
  useFabricRenderer(canvasRef, state)

  return (
    <div className="center">
      <div className="view-header">
        <div className="vtabs">
          {PANELS.map(p => (
            <button
              key={p}
              className={`vtab${state.panel===p?' active':''}`}
              onClick={() => dispatch({type:'SET_PANEL', panel:p})}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        <div className="view-actions">
          <div className="zoom-btns">
            <button className="zoom-btn"
              onClick={() => dispatch({type:'SET_TS', ts:state.ts-2})}>−</button>
            <button className="zoom-btn"
              onClick={() => dispatch({type:'SET_TS', ts:state.ts+2})}>+</button>
          </div>
          <div className="export-btns">
            <button className="exp-btn" onClick={() => exportPNG(canvasRef.current)}
              title="Download PNG">⬇ PNG</button>
            <button className="exp-btn" onClick={() => exportJSON(state)}
              title="Download JSON">⬇ JSON</button>
            <button className="exp-btn" onClick={() => exportWIF(state)}
              title="Download WIF">⬇ WIF</button>
          </div>
        </div>
      </div>

      <div className="canvas-wrap">
        {state.panel === 'fabric' && (
          <canvas ref={canvasRef} className="fabric-canvas"/>
        )}
        {state.panel === 'draft' && (
          <DraftGrid state={state}/>
        )}
        {state.panel === 'peg' && (
          <PegPlan state={state}/>
        )}
      </div>

      <div className="status-bar">
        <span className="pill"><span className="dot"/>Ready</span>
        <span className="pill">{state.sett.reduce((a,s) => a+s.n, 0)} threads</span>
        <span className="pill">{WEAVE_LABELS[state.weave]}</span>
        <span className="pill">{state.ts}px · ×{state.reps}</span>
      </div>
    </div>
  )
}
