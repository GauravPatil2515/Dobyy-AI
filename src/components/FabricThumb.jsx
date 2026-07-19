import { useEffect, useRef, useMemo } from 'react'
import { renderFabric } from '../hooks/useFabricRenderer.js'
import { expandSett, weaveMatrix } from '../utils/weaveUtils.js'

/**
 * Cheap static fabric thumbnail for a saved design (used in the Gallery grid).
 * Renders the woven preview at a small thread size, then CSS-scales it to fit
 * a fixed square box so the gallery grid stays uniform.
 */
export default function FabricThumb({ sett, weave, size = 56 }) {
  const ref = useRef(null)
  const threads = useMemo(() => expandSett(sett), [sett])
  const tileSize = threads.length || 1
  const matrix = useMemo(() => weaveMatrix(weave, tileSize), [weave, tileSize])

  useEffect(() => {
    if (!ref.current) return
    // Render a few repeats at a small thread size, cheap enough for a grid.
    const reps = Math.max(2, Math.min(6, Math.round(size / tileSize / 4) || 2))
    const ts = Math.max(3, Math.floor(size / (tileSize * reps)) || 3)
    renderFabric(ref.current, { sett, weave, ts, reps }, matrix, threads)
  }, [sett, weave, matrix, threads, size])

  return (
    <canvas
      ref={ref}
      className="gallery-thumb-canvas"
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius: 4,
        background: 'var(--off)',
        display: 'block',
        cursor: 'pointer',
      }}
      title={`${threads.length} threads · ${weave}`}
    />
  )
}
