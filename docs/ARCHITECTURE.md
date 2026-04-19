# Architecture

## App Overview

Dobby Studio is a **React 18 + Vite** frontend application with **Vercel serverless backend** for API proxying. The app is a real-time fabric design tool with AI assistance, 3D preview, and industry-standard exports.

## Project Structure

```
src/
├── App.jsx                    ← Root component, state management
├── components/
│   ├── Sidebar.jsx           ← Sett builder, controls, library
│   ├── FabricCanvas.jsx      ← 2D fabric renderer (HTML5 Canvas)
│   ├── DrapeView.jsx         ← 3D cloth simulation (Three.js)
│   ├── ChatPanel.jsx         ← AI chat interface
│   ├── DraftGrid.jsx         ← Weaving draft view
│   ├── PegPlan.jsx           ← Dobby peg plan grid
│   └── Header.jsx            ← Top navigation
├── hooks/
│   ├── useFabricRenderer.js  ← Canvas render loop (RAF)
│   ├── useUndoRedo.js        ← Undo/redo state stack
│   └── useLocalStorage.js    ← Persist designs
├── utils/
│   ├── groqClient.js         ← Chat API (calls /api/chat)
│   ├── imageAnalysis.js      ← Groq Vision + K-means fallback
│   ├── sett.js               ← expandSett, reflective repeat
│   ├── weaveMatrix.js        ← makeWeaveMatrix, caching
│   ├── colorUtils.js         ← hexToRgb, optical blend
│   ├── notation.js           ← toSettNotation, parseSettNotation
│   ├── wif.js                ← WIF export format
│   └── canvas.js             ← Canvas drawing utilities
├── api/ (Vercel serverless)
│   └── chat.js               ← POST → Groq Chat API proxy
├── data/
│   ├── presets.js            ← Scottish Tartan Registry data
│   └── colorCodes.js         ← R=Red, K=Black, etc.
└── index.css                 ← Global styles + CSS variables
```

## State Management

**App.jsx** manages a single state object `S`:

```javascript
const [state, dispatch] = useReducer(fabricReducer, initialState);

// State shape:
{
  sett:              [{c: "#hex", n: number}, ...],  // color stripes
  weave:             "twill22|twill21|plain|satin5", // structure
  threadSize:        8,                              // px per thread
  repeats:           3,                              // pattern repeats
  epi:               50,                             // ends per inch
  ppi:               48,                             // picks per inch
  activePanel:       "fabric|draft|peg|drape",       // current view
  activePreset:      0,                              // selected preset (-1=custom)
  library:           [{name, sett, weave, thumb}],  // saved designs
  fiberCanvas:       HTMLCanvasElement,             // noise texture
  lastPresetName:    "Royal Stewart",               // current design name
  undoStack:         [/* previous states */],        // undo history
  redoStack:         [/* redo states */]             // redo history
}
```

## Rendering Pipeline

### 1. User Input
- Chat message
- Color/stripe change
- Image drop
- Preset selection
- Slider adjustment

### 2. State Update
Dispatch action to `fabricReducer`:
```javascript
dispatch({ 
  type: 'UPDATE_SETT', 
  payload: newSett 
});
```

### 3. Component Updates
React re-renders only affected components:
- `Sidebar` → stripe list, controls
- `SettPreview` → color bar
- Canvas components → request new render

### 4. Canvas Rendering (RAF Loop)
`useFabricRenderer` hook manages animation frame:
```javascript
function renderFrame() {
  // Get current cached weave matrix
  const matrix = getCachedMatrix(weave, size);
  
  // Render 5-pass algorithm:
  // 1. Thread color interlacing
  // 2. Diagonal twill strokes
  // 3. Fiber noise texture overlay
  // 4. Vignette shading
  // 5. Scanline effect
  
  ctx.drawImage(fabricCanvas, 0, 0);
  requestAnimationFrame(renderFrame);
}
```

### 5. Three.js 3D Update (if drape tab active)
- Canvas texture applied to cloth mesh
- Gravity + wind simulation
- Real-time animation

## Core Functions

### Sett Processing

**expandSett(sett)** — Creates reflective repeat (textile standard)
```javascript
function expandSett(sett) {
  const flat = sett.flatMap(s => Array(s.n).fill(s.c));
  
  // Reflective: forward + reverse (without doubling endpoints)
  const reversed = [...flat.reverse().slice(1, -1)];
  
  return [...flat, ...reversed];
}

// Input:  [{c:"#R", n:4}, {c:"#K", n:2}]
// Flat:   [#R, #R, #R, #R, #K, #K]
// Output: [#R, #R, #R, #R, #K, #K, #K, #R, #R, #R, #R]
```

### Weave Matrix Caching

**getCachedMatrix(weave, size)**
```javascript
const matrixCache = {};

function getCachedMatrix(weave, size) {
  const key = `${weave}_${size}`;
  
  if (!matrixCache[key]) {
    matrixCache[key] = makeWeaveMatrix(weave, size);
  }
  
  return matrixCache[key];
}
```

Prevents expensive recalculation in loop: 60+ FPS maintained.

### Fabric Rendering Algorithm

**renderFabric(ctx, state)**

1. **Expand sett** → Get full thread colors
2. **Get or make weave matrix** → Binary interlace pattern
3. **For each pixel (x, y):**
   - `warpIdx = x % threadCount`
   - `weftIdx = y % threadCount`
   - `isWarpUp = matrix[y][x] === 1`
   - If `isWarpUp`: blend 70% warp + 30% weft
   - Else: blend 70% weft + 30% warp (optical mix)
4. **Apply fiber texture** → Noise canvas overlay for realism
5. **Add vignette** — Subtle darkening at edges
6. **Apply scanlines** — Subtle horizontal lines for thread appearance

### Chat Integration

**askGroq(userMessage, currentState)**

1. Build context: current sett notation, weave, EPI/PPI
2. Call `/api/chat` (Vercel serverless)
3. Groq returns JSON with changed fields only:
   ```json
   {
     "reply": "Beautiful autumn design...",
     "sett": [{c:"#8B4513",n:8}, ...],
     "weave": "twill22",
     "intent": "colors: browns, golds, greens"
   }
   ```
4. Merge into state
5. Re-render canvas

**Fallback:** If API fails, use local NLP keyword parser.

### Image Analysis

**handleImageDrop(file)**

1. Try **Groq Vision API** first
   - POST base64 image to `/api/chat`
   - Returns: sett, weave, description, confidence
2. If fails → Use **local K-means**
   - Downsample image to 80×80
   - Cluster to 6 dominant colors
   - Scan middle 10% for horizontal bands (thread widths)
   - Build sett from bands

## Vercel Serverless Functions

### /api/chat.js
Proxies all Groq API calls server-side (keeps API key safe).

```javascript
export default async function handler(req, res) {
  const apiKey = process.env.GROQ_API_KEY;
  
  const response = await fetch(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    }
  );
  
  return res.json(await response.json());
}
```

## Component Hierarchy

```
App
├── Header
│   ├── Theme toggle
│   └── Help button
├── Main Container
│   ├── Sidebar
│   │   ├── Sett Builder
│   │   │   ├── Color input
│   │   │   ├── Thread count input
│   │   │   └── Add/Remove buttons
│   │   ├── Sett Notation Editor
│   │   ├── EPI/PPI Controls
│   │   ├── Weave Selector
│   │   ├── Presets List
│   │   └── Library Grid
│   ├── Canvas Area
│   │   ├── Tab Bar (fabric|draft|peg|drape)
│   │   ├── FabricCanvas (2D)
│   │   ├── DraftGrid (threaded grid)
│   │   ├── PegPlan (dobby pegs)
│   │   └── DrapeView (3D Three.js)
│   └── ChatPanel
│       ├── Message history
│       ├── Input field
│       └── Upload zone

```

## Data Flow Diagram

```
User Action (type chat, click, drop)
         ↓
   Dispatch Action
         ↓
   fabricReducer()
         ↓
   Update State (S)
         ↓
   React Re-render ──→ FabricCanvas
   (Sidebar updated)   ├→ renderFabric() [RAF loop]
                       ├→ Canvas ctx.drawImage()
                       └→ [if 3D] Update Three.js texture
         ↓
   Display updated design
         ↓
   (User sees changes instantly)
```

## Performance Optimizations

1. **Weave Matrix Caching** — Avoid recalc in render loop
2. **Canvas Double-Buffering** — Render to temp canvas, blit to main
3. **Lazy Load Three.js** — Only load on "drape" tab open
4. **Color Lookup Tables** — Pre-compute hex→RGB conversions
5. **RAF Throttling** — Single RAF for all canvas updates
6. **memoize() Components** — React.memo on expensive children

## Browser Compatibility

- **Chrome/Edge** — Full support
- **Firefox** — Full support
- **Safari** — Full support (iOS 14+)
- **Older browsers** — Graceful degradation (warnings, but functional)

## Build Output

`npm run build` creates:
```
dist/
├── index.html          ← Entry point
├── assets/
│   ├── index-XXXXX.js  ← Minified app + dependencies
│   └── index-XXXXX.css ← Minified styles
└── favicon.ico
```

Deployed to Vercel → Accessible globally via CDN.

## Monitoring & Debugging

**Local Dev Server:**
```bash
npm run dev
# Vite HMR: instant refresh on save
# Fast build: ~300ms
```

**Production Build Analysis:**
```bash
npm run build
# Check dist/ folder size
# Expected: ~500KB gzipped
```

**Vercel Deployment:**
- Auto-builds on git push
- Logs available in Vercel dashboard
- `/api/chat` serverless function logs in Vercel Functions panel
