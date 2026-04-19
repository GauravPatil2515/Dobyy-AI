# Features

Complete feature reference for Dobby Studio.

## Sett Builder

The **sett** is the color sequence of warp threads — the foundation of every tartan design.

### Add/Edit Stripes
- Click **+ Add Stripe** to add a new color
- **Color Picker** — Click color swatch to choose
- **Thread Count** — Number of threads (1–20)
- **Order** — Drag stripes to reorder
- **Delete** — Click X to remove stripe

### Live Preview
- **Color Bar** — Visual preview at top shows the full sett
- Updates instantly as you edit
- Reflective repeat shown (not simple tiling)

### Import from Library
- Browse **100+ Scottish tartans** from official registry
- Click to load → Auto-fills sett
- Or search by name: "Royal Stewart", "Black Watch", etc.

---

## Sett Notation (Industry Standard)

**Format:** `R/6 K/2 G/4 B/6` (color code / thread count)

### Supported Color Codes
| Code | Color  | Code | Color   |
|------|--------|------|---------|
| R    | Red    | K    | Black   |
| G    | Green  | B    | Blue    |
| W    | White  | Y    | Yellow  |
| N    | Navy   | T    | Tan     |
| V    | Violet | O    | Orange  |
| P    | Purple | Br   | Brown   |

### How to Use
1. Type or paste notation in the text field
2. Press **Enter** → Sett rebuilds automatically
3. Edit as you design
4. Export includes notation for mill orders

### Example Conversions
| Notation | Stripes |
|----------|---------|
| R/4 K/2 | 4 red + 2 black |
| R/6 K/2 G/6 K/2 | 6 red, 2 black, 6 green, 2 black |

---

## Reflective Repeat (Textile Standard)

Real tartans use **pivot/mirror repeats**, not simple tiling.

### How It Works
```
Sett:      R R R G G K K
Forward:   [R R R G G K K]
Mirror:    [K K G G R R R] (reversed, drop first+last)
Full:      [R R R G G K K K K G G R R R]
```

The pattern **mirrors around the pivot point** (center).

### Why This Matters
- ✅ Authentic looking
- ✅ How real looms weave tartans
- ✅ Symmetrical and balanced
- ✅ Professional appearance

This is automatically applied when rendering. No user action needed.

---

## Weave Structures

The **weave** determines how warp and weft threads interlace.

### 2/2 Twill (`twill22`)
- **Pattern:** Over 2 warp, under 2 weft, offset per row
- **Appearance:** Diagonal twill lines
- **Strength:** Very strong
- **Best for:** Traditional tartans, heavy fabrics
- **Drape:** Good structure, holds shape

### 2/1 Twill (`twill21`)
- **Pattern:** Over 2, under 1 (asymmetrical)
- **Appearance:** Stronger diagonal
- **Strength:** Good
- **Best for:** Elegant tartans with more flow
- **Drape:** Better drape, more fluid

### Plain Weave (`plain`)
- **Pattern:** Over 1, under 1 (checkerboard)
- **Appearance:** Simple grid, no diagonal
- **Strength:** Medium
- **Best for:** Woven checks, fine details
- **Drape:** Less structure, more flexible

### 5-End Satin (`satin5`)
- **Pattern:** Over 4, under 1, offset
- **Appearance:** Smooth, lustrous surface
- **Strength:** Lower (long floats), needs care
- **Best for:** Luxury fabrics, formal wear
- **Drape:** Drapes beautifully, elegant
- **Note:** Floats max 6 threads for strength

---

## Physical Specifications (EPI/PPI)

Calculate real fabric dimensions for production.

### EPI — Ends Per Inch
**Warp thread density** (vertical threads)
- **Default:** 50 EPI
- **Range:** 20–150 (light to dense)
- **Typical:** 40–60 EPI for medium weight

### PPI — Picks Per Inch
**Weft thread density** (horizontal threads)
- **Default:** 48 PPI
- **Range:** 20–150
- **Typical:** 40–60 PPI

### Auto-Calculated Dimensions
When you edit EPI/PPI, the app calculates:

**Repeat Width (cm):**
```
width = (thread_count ÷ EPI) × 2.54 cm
```

**Repeat Height (cm):**
```
height = (thread_count ÷ PPI) × 2.54 cm
```

**Warp Ends for 150cm:**
```
ends = (150cm ÷ repeat_width_cm) × thread_count
```

### Example
- Sett: 16 threads
- EPI: 50, PPI: 48
- **Repeat width:** (16 ÷ 50) × 2.54 = **0.81 cm**
- **Repeat height:** (16 ÷ 48) × 2.54 = **0.85 cm**
- **Physical size:** ~0.81cm × 0.85cm per repeat
- **Warp ends for 150cm:** (150 ÷ 0.81) × 16 = **2963 threads**

---

## AI Chat Assistant (Dobby)

Chat with AI to design fabrics with natural language.

### How It Works
1. **Type a description:**
   ```
   "autumn forest tartan"
   "red and gold with black accents"
   "make it bolder"
   ```

2. **Dobby responds:**
   - Generates new sett (color stripes)
   - Optionally changes weave structure
   - Updates the design live
   - Includes design intent explanation

3. **Context-Aware:**
   - Knows current sett and weave
   - Remembers previous messages
   - Suggests improvements
   - Respects your EPI/PPI and thread size preferences

### AI Model
- **Model:** `llama-3.3-70b-versatile` (Groq)
- **Temperature:** 0.7 (creative, not chaotic)
- **Max tokens:** 512 (good length response)
- **Response format:** JSON with changed fields

### System Prompt
The AI receives context about your current fabric:
```
Current sett: R/6 K/2 G/4
Weave: 2/2 Twill
Thread size: 8px
EPI: 50, PPI: 48
Physical dimensions: 2.05cm × 2.13cm
```

### Fallback (No API Key)
If Groq API unavailable, uses **local NLP keyword parser:**
- Matches keywords: "bold", "finer", "more repeats"
- Makes predictable adjustments
- Lower quality but functional

---

## Image Analysis

Drop a fabric photo → Get an automatic design.

### Method 1: Groq Vision (AI-Powered)
**When:** API key available
**How:**
1. You drop an image
2. App sends to `llama-4-scout-17b` (Groq Vision)
3. AI analyzes colors, pattern, structure
4. Returns: sett, weave, confidence %, description

**Accuracy:** 85–95% (professional fabrics)

**Time:** 2–5 seconds

### Method 2: Local K-Means (Fallback)
**When:** API unavailable or fails
**How:**
1. Downsample image to 80×80 pixels
2. K-means clustering (k=6, 12 iterations)
3. Extract 6 dominant colors
4. Scan middle 10% horizontally for thread widths
5. Build sett from detected bands

**Accuracy:** 50–70% (basic color extraction)

**Time:** <100ms (instant)

### Upload Methods
- **Drag & drop** into the upload zone
- **Click to browse** files
- **Paste** from clipboard (Ctrl+V)
- Supports: JPG, PNG, WebP

### Confidence Score
- **90%+** — Trust completely
- **70–90%** — Good, may need tweaks
- **<70%** — Suggestion only, edit manually

---

## Export Formats

Save and share your designs in multiple formats.

### PNG — Visual Export
**Use for:** Sharing, portfolio, social media
**Contains:** Canvas screenshot (transparent background)
**Size:** ~300KB per design
**Download:** Instant

### JSON — Full Save
**Use for:** Store design state, reload later
**Contains:**
```json
{
  "sett": [{c: "#hex", n: number}, ...],
  "weave": "twill22|twill21|plain|satin5",
  "threadSize": 8,
  "epi": 50,
  "ppi": 48,
  "repeats": 3,
  "name": "My Design"
}
```
**Time:** Instant
**Reload:** Drop JSON back into app

### WIF — Weave Interchange Format 1.1
**Use for:** Professional weaving software
**Compatible with:**
- ArahWeave (🎨 visual design)
- WeavePoint (📊 technical)
- Fiberworks (✨ simulation)
- PixeLoom (🎭 complex patterns)

**Contains:**
- `[THREADING]` — Warp → shaft assignments
- `[TREADLING]` — Pick → treadle assignments
- `[TIEUP]` — Shaft + treadle → loom lift
- `[COLOR TABLE]` — RGB values
- `[WARP]` / `[WEFT]` — Thread specs

**Example Section:**
```
[THREADING]
1
2
1
2
(pattern repeats)
```

### Spec Sheet — Production Document
**Use for:** Send to fabric mills for quotes
**Contains:**
- Sett notation (R/6 K/2 format)
- Weave structure
- EPI / PPI settings
- Physical dimensions (cm)
- Thread count summary
- Design preview image
- Notes section for mill instructions

**Format:** HTML (printable, PDF-friendly)
**Style:** Professional mill-standard layout

---

## 3D Drape Preview

See your design as draped fabric using real physics simulation.

### How It Works
1. Canvas design applied as texture to 3D cloth mesh
2. Gravity pulls cloth down
3. Occasional wind gust pushes fabric
4. Real-time animation updates as design changes

### Controls
- **Zoom:** Scroll wheel
- **Rotate:** Click + drag with mouse
- **Pan:** Right-click + drag

### Two-Way Sync
- Change design in "Fabric" tab → 3D updates
- 3D view always reflecting current state
- Perfect for checking how fabric drapes

### Note
3D view is visual only (non-interactive).  
Edit designs in other tabs, see result in 3D.

---

## Tartan Registry Search

Access 100+ official Scottish tartans.

### How to Search
1. Open **Presets** panel
2. Type clan/family name: "Stewart", "MacDonald", "Cameron"
3. Results load instantly
4. Click to load design

### Data Source
Official **Scottish Tartan Registry**  
https://www.tartanregister.gov.uk

### Featured Tartans
- Royal Stewart (most famous)
- Black Watch
- Hunting Stewart
- Dress Stewart
- Officer's Tartan
- ...and 100+ more

### Load Custom Presets
- Click design → Auto-loads sett and weave
- Edit to customize
- Save to your library
- Export for mill orders

---

## Design Library

Save, organize, and reuse designs.

### Save Current Design
1. Click **Save to Library** button
2. Enter name: "My Royal Stewart"
3. Thumbnail auto-generated from canvas
4. Stored in browser localStorage (persistent)

### Browse Library
- Grid view with thumbnails
- Click to load full design
- Name shown beneath each
- Max 20 designs (localStorage limit)

### Delete Design
- Hover over thumbnail
- Click ✕ to remove

### Export Library
- JSON export includes full library
- Portfolio of all designs in one file
- Share with collaborators

### Storage
- **Location:** Browser localStorage
- **Limit:** ~5 MB per domain
- **Persistence:** Survives refresh, browser restart
- **Sharing:** Export JSON, send to others

---

## Undo / Redo

Never lose a design decision.

### Undo
- **Keyboard:** Ctrl+Z
- **Button:** Undo arrow button (top toolbar)
- **Steps:** Full history (unlimited undo)

### Redo
- **Keyboard:** Ctrl+Y
- **Button:** Redo arrow button (top toolbar)
- **Steps:** Full history (unlimited redo)

### What Triggers History
- ✅ Sett changes
- ✅ Weave changes
- ✅ EPI/PPI edits
- ✅ Chat responses
- ✅ Image analysis
- ✅ Preset loads
- ✗ View changes (zoom, pan)

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+S | Save to library (prompt) |
| Ctrl+E | Export PNG |
| Ctrl+J | Export JSON |
| Ctrl+V | Paste image + analyze |
| Tab | Focus next input |

---

## Dark/Light Theme

Switch between themes.

### Toggle
Click **☀️/🌙** button in header

### Auto Detect
Respects system preference (OS settings)

### Custom
CSS variables in `index.css`:
```css
--bg-primary
--text-primary
--border-color
--accent-color
```

---

## Responsive Design

Works on desktop, tablet, and mobile.

### Breakpoints
- **Desktop:** Full UI (sidebar + canvas + chat)
- **Tablet (≤1024px):** Stacked layout
- **Mobile (≤768px):** Drawer-based navigation

### Touch Support
- Swipe to navigate tabs
- Long-press for context menu
- Pinch to zoom on 3D view

---

## Performance Features

### Weave Matrix Caching
- Precompute twill patterns once
- Reuse across render frames
- Measured: 60+ FPS consistently

### RAF Rendering
- Single animation frame for all canvases
- Prevents duplicate calculations
- Smooth 60Hz animation

### Lazy Loading
- Three.js loaded only on 3D tab open
- Reduces initial bundle size
- Fast startup time

---

## Accessibility

### Keyboard Navigation
- All buttons, inputs reachable via Tab
- Enter to submit, Space to activate
- Escape to close modals

### Color Contrast
- Text meets WCAG AA standards
- High contrast mode available
- Colorblind-friendly palette option

### Screen Readers
- ARIA labels where applicable
- Semantic HTML structure
- Descriptive alt text on images
