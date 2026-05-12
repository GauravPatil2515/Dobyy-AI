import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'

function SortableStripe({ stripe, idx, total, dispatch }) {
  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: idx.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 99 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="stripe-row">
      {/* Drag handle */}
      <div className="drag-handle" {...attributes} {...listeners}
        title="Drag to reorder">
        <svg viewBox="0 0 10 16" width="10" height="16"
          fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="3" cy="3"  r="1" fill="currentColor"/>
          <circle cx="7" cy="3"  r="1" fill="currentColor"/>
          <circle cx="3" cy="8"  r="1" fill="currentColor"/>
          <circle cx="7" cy="8"  r="1" fill="currentColor"/>
          <circle cx="3" cy="13" r="1" fill="currentColor"/>
          <circle cx="7" cy="13" r="1" fill="currentColor"/>
        </svg>
      </div>

      {/* Color swatch */}
      <div className="stripe-color" style={{background: stripe.c}}>
        <input type="color" value={stripe.c}
          onChange={e => dispatch({
            type: 'UPDATE_STRIPE', idx, patch: { c: e.target.value }
          })}/>
      </div>

      {/* Thread count */}
      <input
        type="number"
        className="stripe-n"
        value={stripe.n}
        min={1} max={32}
        onChange={e => dispatch({
          type: 'UPDATE_STRIPE', idx,
          patch: { n: Math.max(1, Math.min(32, +e.target.value)) }
        })}/>
      <span className="stripe-label">{stripe.n}t</span>

      {/* Delete */}
      {total > 1 && (
        <button className="stripe-del"
          onClick={() => dispatch({ type: 'REMOVE_STRIPE', idx })}>
          ×
        </button>
      )}
    </div>
  )
}

export default function SettBuilder({ sett, dispatch, totalThreads }) {
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIdx = parseInt(active.id)
    const newIdx = parseInt(over.id)
    const newSett = arrayMove([...sett], oldIdx, newIdx)
    dispatch({ type: 'REORDER_SETT', newSett })
  }

  const ids = sett.map((_, i) => i.toString())

  return (
    <div className="section">
      <div className="section-header">
        <div className="section-title">Sett Builder</div>
        <div className="section-meta">{totalThreads} threads / repeat</div>
      </div>

      {/* Sett bar preview */}
      <div className="sett-bar">
        {sett.flatMap((s, i) =>
          Array.from({ length: s.n }, (_, j) => (
            <div key={`${i}-${j}`} style={{ flex: 1, background: s.c, minWidth: 2 }}/>
          ))
        )}
      </div>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={e => setActiveId(e.active.id)}
        onDragEnd={handleDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="sett-strips">
            {sett.map((stripe, idx) => (
              <SortableStripe
                key={idx}
                stripe={stripe}
                idx={idx}
                total={sett.length}
                dispatch={dispatch}/>
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activeId !== null ? (
            <div className="stripe-row drag-overlay">
              <div className="stripe-color"
                style={{ background: sett[parseInt(activeId)]?.c }}/>
              <span className="stripe-label" style={{ flex: 1 }}>
                {sett[parseInt(activeId)]?.n}t
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <button className="btn-add"
        onClick={() => dispatch({ type: 'ADD_STRIPE' })}>
        ＋ Add Color Stripe
      </button>
    </div>
  )
}
