import { useRef, useState } from 'react'
import { useFabricRenderer } from '../hooks/useFabricRenderer.js'
import { copyShareLink } from '../utils/shareUtils.js'
import { shaftCount, wifTieup } from '../utils/weaveUtils.js'
import { nearestPantone } from '../utils/pantoneData.js'
import { exportPDFTechSheet } from '../utils/pdfExport.js'
import DrapeView from './DrapeView.jsx'

const PANELS = ['fabric', 'draft', 'peg', 'drape']
const PANEL_LABELS = {
  fabric: 'Fabric',
  draft:  'Draft',
  peg:    'Peg Plan',
  drape:  '3D Drape'
}
const WEAVE_LABELS = {
  twill22:'2/2 Twill', twill21:'2/1 Twill',
  plain:'Plain Weave', satin5:'5-End Satin',
  twill31:'3/1 Twill', basket2:'Basket Weave',
  hopsack:'Hopsack'
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
  const L      = threads.length
  const shafts = shaftCount(state.weave)
  const tieup  = wifTieup(state.weave)

  const hexToRGB = hex => {
    const n = parseInt(hex.replace('#',''), 16)
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`
  }

  const threading  = threads.map((_, i) => `${i+1}=${(i % shafts) + 1}`)
  const weftColors = threads.map((c, i) => `${i+1}=${hexToRGB(c)}`)

  const wifLines = [
    '[WIF]', 'Version=1.1',
    'Date=' + new Date().toDateString(),
    'Developers=Dobby Studio',
    'Source Program=Dobby Studio React',
    '',
    '[CONTENTS]',
    'Color Palette=true', 'Threading=true',
    'Tieup=true', 'Weft Colors=true',
    '',
    '[COLOR PALETTE]', 'Entries=' + L, 'Form=RGB', 'Unit=Percent',
    '',
    '[COLOR TABLE]',
    ...threads.map((c, i) => `${i+1}=${hexToRGB(c)}`),
    '',
    '[THREADING]', ...threading,
    '', '[TIEUP]', ...tieup,
    '',
    '[WEFT COLORS]', `Entries=${L}`,
    '',
    '[WEFT COLOR TABLE]', ...weftColors,
  ]

  const blob = new Blob([wifLines.join('\n')], { type: 'text/plain' })
  const link = document.createElement('a')
  link.download = `dobby-studio-${Date.now()}.wif`
  link.href = URL.createObjectURL(blob)
  link.click()
  URL.revokeObjectURL(link.href)
}

// Pantone tooltip shown on hover over each stripe swatch
function PantoneTooltip({ hex }) {
  const [show, setShow] = useState(false)
  const match = nearestPantone(hex)
  return (
    <span
      style={{ position:'relative', display:'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}>
      <span style={{
        display:'inline-block', width:12, height:12,
        borderRadius:2, background:hex,
        border:'1px solid rgba(0,0,0,.2)',
        cursor:'help', verticalAlign:'middle'
      }}/>
      {show && (
        <span style={{
          position:'absolute', bottom:'120%', left:'50%',
          transform:'translateX(-50%)',
          background:'#1a1a1a', color:'#fff',
          fontSize:10, padding:'4px 8px',
          borderRadius:4, whiteSpace:'nowrap',
          zIndex:9999, pointerEvents:'none',
          boxShadow:'0 2px 8px rgba(0,0,0,.3)'
        }}>
          <span style={{
            display:'inline-block', width:10, height:10,
            borderRadius:2, background:match.pantoneHex,
            border:'1px solid rgba(255,255,255,.3)',
            marginRight:5, verticalAlign:'middle'
          }}/>
          {match.code} {match.name}
          <br/>
          <span style={{color:'#aaa',fontSize:9}}>Δ{match.delta} from {hex.toUpperCase()}</span>
        </span>
      )}
    </span>
  )
}

function DraftGrid({ state }) {
  const threads = []
  state.sett.forEach(s => { for(let i=0;i<s.n;i++) threads.push(s.c) })
  const L      = Math.min(threads.length * state.reps, 80)
  const shafts = shaftCount(state.weave)
  const cs     = 10

  return (
    <div className="draft-wrap">
      <div className="draft-label">Threading Draft — {WEAVE_LABELS[state.weave]} · {shafts} shafts</div>
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
            const tied = s === t
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
        {Array.from({length:Math.min(L,40)}, (_,i) =>
          Array.from({length:Math.min(L,40)}, (_,j) => {
            const shaft = j % shafts
            const up = shaft === (i % shafts)
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
  const L      = Math.min(threads.length * state.reps, 60)
  const shafts = shaftCount(state.weave)
  const cs     = 12

  return (
    <div className="draft-wrap">
      <div className="draft-label">Peg Plan — {WEAVE_LABELS[state.weave]} · {shafts} shafts</div>
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
  const [copied, setCopied] = useState(false)
  useFabricRenderer(canvasRef, state)

  const handleShare = async () => {
    await copyShareLink(state)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const totalThreads = state.sett.reduce((a,s) => a+s.n, 0)

  return (
    <div className="center">
      <div className="view-header">
        <div className="vtabs">
          {PANELS.map(p => (
            <button
              key={p}
              className={`vtab${state.panel===p?' active':''}`}
              onClick={() => dispatch({type:'SET_PANEL', panel:p})}>
              {PANEL_LABELS[p]}
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
              title="Download WIF (loom-ready)">⬇ WIF</button>
            <button
              className="exp-btn pdf-btn"
              onClick={() => exportPDFTechSheet(state, canvasRef.current)}
              title="Download PDF Tech Sheet (mill-ready with Pantone codes)">
              ⬇ PDF Sheet
            </button>
            <button className="exp-btn share-btn" onClick={handleShare} title="Copy share link">
              {copied ? '✓ Copied!' : '🔗 Share'}
            </button>
          </div>
        </div>
      </div>

      <div className="canvas-wrap">
        {state.panel === 'fabric' && (
          <>
            <canvas ref={canvasRef} className="fabric-canvas"/>
            {/* Pantone swatch row — hover any swatch to see nearest Pantone TCX */}
            <div style={{
              display:'flex', gap:4, justifyContent:'center',
              padding:'6px 0', flexWrap:'wrap'
            }}>
              {state.sett.map((s, i) => (
                <PantoneTooltip key={i} hex={s.c} />
              ))}
            </div>
          </>
        )}
        {state.panel === 'draft' && <DraftGrid state={state}/>}
        {state.panel === 'peg'   && <PegPlan state={state}/>}
        {state.panel === 'drape' && <DrapeView state={state}/>}
      </div>

      <div className="status-bar">
        <span className="pill"><span className="dot"/>Ready</span>
        <span className="pill">{totalThreads} threads</span>
        <span className="pill">{WEAVE_LABELS[state.weave]}</span>
        <span className="pill">{shaftCount(state.weave)}-shaft</span>
        <span className="pill">{state.ts}px · ×{state.reps}</span>
      </div>
    </div>
  )
}
