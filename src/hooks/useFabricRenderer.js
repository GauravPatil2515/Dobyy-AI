import { useEffect, useRef } from 'react'
import { expandSett, weaveMatrix, getFiberCanvas } from '../utils/weaveUtils.js'
import { h2r, blend, toRgba, lighter, darker } from '../utils/colorUtils.js'

function renderFabric(canvas, { sett, weave, ts, reps }) {
  const threads = expandSett(sett)
  if (!threads.length || !canvas) return

  const L     = threads.length
  const total = L * reps
  canvas.width  = total * ts
  canvas.height = total * ts
  const ctx = canvas.getContext('2d')
  const M   = weaveMatrix(weave, total)

  // Pass 1 — Optical mix fill
  for(let i=0; i<total; i++) {
    for(let j=0; j<total; j++) {
      const up  = M[i][j] === 1
      const wc  = h2r(threads[j % L])
      const fc  = h2r(threads[i % L])
      const col = blend(wc, fc, up ? 0.70 : 0.30)
      ctx.fillStyle = toRgba(col)
      ctx.fillRect(j*ts, i*ts, ts, ts)
    }
  }

  // Pass 2 — Twill strokes + highlights
  for(let i=0; i<total; i++) {
    for(let j=0; j<total; j++) {
      const x   = j * ts
      const y   = i * ts
      const up  = M[i][j] === 1
      const col = blend(h2r(threads[j%L]), h2r(threads[i%L]), up ? 0.70 : 0.30)

      ctx.strokeStyle = toRgba(lighter(col, 50), 0.46)
      ctx.lineWidth   = Math.max(0.4, ts * 0.15)
      ctx.beginPath()
      ctx.moveTo(x,        y + ts * 0.2)
      ctx.lineTo(x + ts * 0.8, y)
      ctx.stroke()

      ctx.strokeStyle = toRgba(darker(col, 36), 0.36)
      ctx.lineWidth   = Math.max(0.4, ts * 0.12)
      ctx.beginPath()
      ctx.moveTo(x + ts * 0.2, y + ts)
      ctx.lineTo(x + ts,       y + ts * 0.2)
      ctx.stroke()

      if (ts >= 8 && up) {
        const g = ctx.createRadialGradient(
          x + ts*0.3, y + ts*0.27, 0,
          x + ts*0.3, y + ts*0.27, ts*0.35
        )
        g.addColorStop(0, 'rgba(255,255,255,0.32)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(x, y, ts, ts)
      }
    }
  }

  // Pass 3 — Shadow grid
  if (ts >= 6) {
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'
    ctx.lineWidth   = 0.5
    for(let i=0; i<total; i++)
      for(let j=0; j<total; j++)
        ctx.strokeRect(j*ts + 0.25, i*ts + 0.25, ts - 0.5, ts - 0.5)
  }

  // Pass 4 — Fiber noise overlay
  const fiber = getFiberCanvas()
  ctx.save()
  ctx.globalCompositeOperation = 'multiply'
  ctx.globalAlpha = 0.11
  ctx.fillStyle   = ctx.createPattern(fiber, 'repeat')
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.restore()

  // Pass 5 — Vignette
  const vg = ctx.createRadialGradient(
    canvas.width/2, canvas.height/2, Math.min(canvas.width, canvas.height) * 0.28,
    canvas.width/2, canvas.height/2, Math.max(canvas.width, canvas.height) * 0.75
  )
  vg.addColorStop(0, 'rgba(0,0,0,0)')
  vg.addColorStop(1, 'rgba(0,0,0,0.08)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}

export function useFabricRenderer(canvasRef, state) {
  const rafRef = useRef(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      renderFabric(canvasRef.current, state)
      rafRef.current = null
    })
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [state.sett, state.weave, state.ts, state.reps])
}
