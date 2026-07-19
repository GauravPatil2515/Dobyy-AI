---
title: State Management
type: module-doc
tags: [state, reducer, undo, hooks]
status: active
date: 2026-06-23
---

# State Management

Dobby Studio uses a single `useReducer` hook with a custom history layer for undo/redo.

## Reducer

Located in `src/hooks/useFabricState.js`.

### State Shape

```js
{
  sett:         [{ c: '#hex', n: 4, id: 's_1_abc' }, ...],  // stripes
  weave:        'twill22',          // weave type
  ts:           8,                 // thread size (4-22)
  reps:         3,                 // repeat count (1-12)
  activePreset: 0,                 // index of active preset (-1 = custom)
  panel:        'fabric',          // active view panel
  theme:        'light' | 'dark',  // UI theme
}
```

### Action Types

| Action | Description |
|--------|-------------|
| `SET_WEAVE` | Change weave type |
| `SET_TS` | Change thread size (clamped 4-22) |
| `SET_REPS` | Change repeat count (clamped 1-12) |
| `SET_PANEL` | Switch view panel |
| `SET_PRESET` | Load a preset sett |
| `ADD_STRIPE` | Add new stripe to sett |
| `UPDATE_STRIPE` | Modify stripe color or count |
| `REMOVE_STRIPE` | Delete stripe (min 1) |
| `REORDER_SETT` | Drag-and-drop reorder |
| `APPLY` | Replace full state (used by AI, DesignDrop, load) |
| `TOGGLE_THEME` | Switch light/dark |

### Stable IDs

Every stripe has a stable `id` field (`s_<counter>_<random>`) used as dnd-kit key. The `APPLY` action ensures all incoming stripes have IDs.

## Undo/Redo

Implemented via `useRef` (not state) to avoid re-renders:

```
history.current = [INITIAL, ...states]   // array of past states
histIdx.current = N                       // current position
skipDepth.current = 0                     // prevents recursive history
```

- `dispatchWithHistory` — wraps dispatch, pushes to history for tracked actions
- `undo()` — moves histIdx back, dispatches APPLY with skipDepth
- `redo()` — moves histIdx forward, dispatches APPLY with skipDepth
- **History cap:** 50 entries max (oldest trimmed)

## Chat History

Separate `useState` in `useFabricState`:
- Last 10 messages sent to LLM as conversation context
- Includes user messages + AI replies
- Does not include system prompt (injected per-request)

## skipDepth Pattern

When undo/redo dispatches APPLY, `skipDepth.current` is incremented to prevent the APPLY itself from being recorded as a history entry. Decremented after dispatch.
