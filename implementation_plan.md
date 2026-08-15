# Fix Plan: Production-Ready Polish

## Root Causes Found

### 🔴 Critical — TryOnView looks bad
1. **Camera too far / wrong FOV** — garment appears tiny; camera position `(0, 0.4, 4.2)` is too far for the kilt/jacket size
2. **Kilt apron is front-facing but camera isn't square with it** — looks like a stump
3. **Scarf drape is too fast / too chaotic** — oscillation parameters make fabric look like water, not cloth
4. **Scene background stays dark `#1a1815`** but canvas-wrap has a different bg — visible seam/border
5. **`tryon-canvas` has no explicit `min-height`** — in many window sizes it collapses to 0px
6. **Jacket sleeves angle wrong** — `Math.PI / 2.2` too steep; looks like raised arms
7. **No loading skeleton** — blank black box while Three.js initialises

### 🟡 Important — Chat panel UI broken
8. **AI bubbles render raw HTML** — `buildAnalysisMessage()` returns HTML string with `<span>` tags, but `{m.text}` renders it as plain text (shows `<span style=...>` literally)
9. **Chat messages don't auto-scroll reliably** — `scrollTop = scrollHeight` on `msgs` change but the ref points to container which may not be re-measured yet
10. **`.chat-msgs` has no explicit `height: 0`** — on some breakpoints it doesn't flex-fill correctly
11. **Chips row overflows / wraps ugly** — `max-height: 78px` and `overflow-y: auto` creates a tiny scrollable box that looks broken
12. **`.input-wrap` uses `oklch(from ...)` relative syntax** — not supported in Firefox <128, causes silent failure

### 🟢 Minor — Polish
13. **AuthContext forced `isOffline: true`** — I changed this temporarily for testing; must be reverted to `!navigator.onLine`
14. **`smoke_test.js` is in the project root** — cleanup

## Changes

### 1. `src/contexts/AuthContext.jsx`
- Revert `isOffline` to `!navigator.onLine` (was changed to `true` for testing)

### 2. `src/components/TryOnView.jsx` — Full rewrite of:
- Camera: `position.set(0, 0.6, 3.2)`, FOV 42
- Kilt: taller H=2.2, apron wider, texture repeat corrected
- Scarf: slower, gentler wave (`t * 0.4` instead of `t * 1.2`)
- Jacket: sleeves at `Math.PI / 2.8` (more natural angle), position adjusted
- Throw: larger corner folds for visual interest
- Add `canvasReady` state → show loading skeleton until scene is up
- Garment emoji labels for buttons

### 3. `src/components/ChatPanel.jsx` — Fix HTML rendering:
- AI messages that contain HTML tags → render via `dangerouslySetInnerHTML` with a safe allowlist check
- Fix auto-scroll: use `requestAnimationFrame` wrapper
- Remove the `📷 From Image` chip from the chip row (it already exists as a dedicated button in input bar — duplicate)

### 4. `src/styles/main.css`
- `.tryon-canvas { min-height: 340px }` 
- `.chat-msgs { height: 0; flex: 1 }` (force flex fill)
- `.chips { max-height: none; overflow: visible }` (remove broken scroll)
- Replace `oklch(from var(--ac) ...)` with a solid fallback value
- `tryon-toolbar` garment buttons get emoji icons for clarity

### 5. Delete `smoke_test.js` from project root
