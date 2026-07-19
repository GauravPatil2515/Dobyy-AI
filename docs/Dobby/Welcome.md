---
title: Dobby Studio — AI Fabric & Tartan Designer
type: project-doc
tags:
  - ai
  - fabric-design
  - tartan
  - react
  - firebase
  - three.js
  - llm
  - active
status: active
date: 2026-06-23
aliases:
  - Dobby Studio
  - Mini Dobby
  - Dobby
cssclasses: dashboard
---

# Dobby Studio — AI-Powered Fabric & Tartan Designer

> Natural language to woven fabric. Describe your vision, watch the loom respond.

**Project Dir:** `/home/gaurav/Desktop/gaurav code /Project/Academic /mini-dobby/`
**Live URL:** https://dobyy-ai.vercel.app
**Stack:** React 18 + Vite + Firebase (Auth/Firestore/Analytics) + Three.js + Groq LLM

## What This Is

Dobby Studio is an AI-powered textile design tool that lets users create tartan and fabric patterns through natural language. Type "red and navy tartan" and the system generates a realistic woven fabric visualization with proper thread-level rendering, multiple weave structures, and technical export formats for mills.

## Key Features

- **Natural Language Design** — Describe any tartan/fabric in plain English, Groq LLM generates the sett (stripe pattern)
- **Real-time Fabric Rendering** — Canvas-based pixel-level weave simulation with 7 weave types (twill, plain, satin, basket, hopsack)
- **4 View Modes** — Fabric (realistic weave), Draft (threading diagram), Peg Plan, 3D Drape (Three.js cloth simulation)
- **AI Image Analysis** — Upload a fabric photo, extract colors and pattern using Groq Vision via OpenRouter
- **Design Gallery** — Save/load designs to Firestore with offline localStorage fallback
- **Technical Exports** — PNG, JSON, WIF (loom-ready), PDF Tech Sheet (mill-ready with Pantone TCX color matching)
- **Tartan Registry Search** — Real tartan patterns from Scottish Tartans Authority API
- **Design Variations (Design Drop)** — AI generates 6 style variations of current sett (darker, lighter, contrasting, etc.)
- **Voice Input** — Web Speech API for hands-free design
- **i18n** — English, Hindi, Gujarati
- **Responsive** — Desktop 3-column layout, mobile overlay with drawer

## Quick Start

```bash
cd ~/Desktop/gaurav\ code\ /Project\Academic\ mini-dobby

# Install
npm install

# Development (copy .env.example to .env.local and fill in keys)
npm run dev

# Build
npm run build

# Preview production build
npm run preview
```

**Required Env Vars (`.env.local`):**

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase Auth + Firestore |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics |
| `VITE_GROQ_API_KEY` | Groq LLM (server proxy) |
| `VITE_OPENROUTER_API_KEY` | OpenRouter (image analysis) |

**Server Env Vars (Vercel):**

| Variable | Purpose |
|----------|---------|
| `GROQ_API_KEY` | Server-side Groq proxy |
| `OPENROUTER_KEY` | Server-side OpenRouter proxy |
| `ALLOWED_ORIGIN` | CORS origin |
| `FIREBASE_PROJECT_ID` | Token verification |

## Project Structure

```
mini-dobby/
├── api/                    # Vercel serverless functions
│   ├── chat.js             # Groq chat proxy (rate-limited)
│   ├── openrouter.js       # OpenRouter vision proxy
│   └── groq/[...path].js   # Groq direct proxy
├── src/
│   ├── components/         # React UI components
│   │   ├── Header.jsx      # App header, undo/redo, profile
│   │   ├── Sidebar.jsx     # Sett builder, presets, gallery, registry
│   │   ├── FabricCanvas.jsx # Main canvas with 4 view modes
│   │   ├── ChatPanel.jsx   # AI design assistant
│   │   ├── SettBuilder.jsx # Stripe editor with drag-and-drop
│   │   ├── DesignDrop.jsx  # AI variations modal
│   │   ├── DrapeView.jsx   # Three.js 3D cloth simulation
│   │   ├── Gallery.jsx     # Saved designs manager
│   │   ├── RegistrySearch.jsx # Scottish Tartans Authority search
│   │   ├── VoiceControl.jsx # Web Speech API input
│   │   ├── LandingPage.jsx # Animated intro screen
│   │   ├── LoginPage.jsx   # Google auth + demo mode
│   │   └── UpgradeModal.jsx # Pro tier upsell
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.jsx # Firebase auth + demo mode
│   │   ├── SubscriptionContext.jsx # Tier/usage tracking
│   │   └── OfflineContext.jsx # Network status banner
│   ├── hooks/              # Custom hooks
│   │   ├── useFabricState.js # Reducer + undo/redo + AI processing
│   │   ├── useFabricRenderer.js # Canvas rendering pipeline
│   │   └── useFirestoreGallery.js # Gallery CRUD with offline fallback
│   ├── utils/              # Utility modules
│   │   ├── groqClient.js   # Groq LLM client + system prompt
│   │   ├── nlpEngine.js    # Local NLP for presets/colors/weaves
│   │   ├── weaveUtils.js   # Weave matrices, fiber noise, WIF export
│   │   ├── colorUtils.js   # Color conversion, blending
│   │   ├── shareUtils.js   # URL share link encoding/decoding
│   │   ├── imageAnalyzer.js # Image upload → Groq Vision → sett
│   │   ├── pdfExport.js    # PDF tech sheet generation
│   │   ├── pantoneData.js  # Pantone TCX nearest-match
│   │   ├── tartanRegistry.js # Scottish Tartans API client
│   │   └── i18n.js         # Internationalization (en/hi/gu)
│   ├── data/               # Static data
│   │   ├── presets.js      # 8 classic tartan presets
│   │   └── colors.js       # Named color → hex mapping
│   ├── constants.js        # Shared constants (weaves, panels, labels)
│   ├── firebase.js         # Firebase initialization
│   ├── styles/main.css     # 1700+ line design system
│   ├── App.jsx             # Root component with routing
│   └── main.jsx            # Entry point with providers
├── firestore.rules         # Security rules (top-level /designs)
├── .env.example            # Environment template
└── vite.config.js          # Vite + dev proxy config
```

## Architecture

### Data Flow

```
User Input (chat / voice / image)
    ↓
NLP Engine (local) → preset / color / weave match
    ↓ (if no match)
Groq LLM (/api/chat proxy) → JSON sett response
    ↓
useFabricState reducer → state.sett / weave / ts / reps
    ↓
Canvas renderer (5-pass: optical mix → strokes → highlights → grid → fiber → vignette)
    ↓
User edits (sidebar sliders / drag-drop) → same pipeline
```

### Component Tree

```
<OfflineProvider>
  <AuthProvider>
    <SubscriptionProvider>
      <App>
        <Header> — logo, undo/redo, lang switcher, profile
        <Sidebar> — SettBuilder, Gallery, RegistrySearch, Presets, Weave controls
        <FabricCanvas> — 4 tabs (Fabric / Draft / Peg / 3D Drape)
        <ChatPanel> — AI assistant, chips, voice, image upload
        <DesignDrop> — lazy-loaded variations modal
        <UpgradeModal> — lazy-loaded pro upsell
        <LandingPage> — animated intro (first visit)
        <LoginPage> — Google auth + demo mode
```

### AI Pipeline

1. **Local NLP** (`utils/nlpEngine.js`) — Handles presets, color names, weave keywords, thread size without API call
2. **Groq LLM** (`utils/groqClient.js` → `/api/chat`) — Full design generation with system prompt enforcing JSON-only responses
3. **Image Analysis** (`utils/imageAnalyzer.js` → `/api/openrouter`) — Resize to 512px, Groq Vision, fallback to local k-means (16×16 grid sampling)

### Rendering Pipeline

5-pass canvas rendering (`hooks/useFabricRenderer.js`):
1. Optical color blend (warp × weft, 70/30 ratio)
2. Twill stroke lines + shadow strokes
3. Specular highlights (radial gradient, only when ts≥8 and warp up)
4. Shadow grid (subtle cell borders)
5. Fiber noise overlay via `multiply` blend mode
6. Vignette (dark edges)

### State Management

- **useReducer** with 11 action types (SET_WEAVE, SET_TS, SET_REPS, SET_PRESET, ADD_STRIPE, UPDATE_STRIPE, REMOVE_STRIPE, REORDER_SETT, APPLY, SET_PANEL, TOGGLE_THEME)
- **Undo/redo** via useRef-based history stack (capped at 50 entries)
- **Chat history**: last 10 messages sent to LLM as context
- **skipDepth ref**: prevents undo/redo from creating history entries

### Weave Types

| Type | Shafts | Pattern |
|------|--------|---------|
| `twill22` | 4 | `(i+j)%4<2` — standard 2/2 twill |
| `twill21` | 3 | `(i+j)%3<2` — 2/1 twill |
| `twill31` | 4 | `(i+j)%4<3` — 3/1 twill |
| `plain` | 2 | `(i+j)%2` — plain weave |
| `satin5` | 5 | `(i+j)%5===0` — 5-end satin |
| `basket2` | 2 | `(floor(i/2)+floor(j/2))%2` — basket weave |
| `hopsack` | 2 | `(floor(i/2)+j)%2` — hopsack |

## Business Model

| Tier | Price | Daily API Calls | Saved Designs | WIF Export | Variations |
|------|-------|-----------------|---------------|------------|------------|
| Free | $0 | 5 | 20 | ✗ | 6 per session |
| Pro | $9/mo | 100 | 200 | ✓ | Unlimited |

## Security

- **Rate limiting** — server-side in-memory store, keyed by `uid:YYYY-MM-DD`, verified via Firebase JWT
- **CORS** — scoped to `ALLOWED_ORIGIN` (never wildcard)
- **Input sanitization** — messages content limited to 4000 chars, max 20 messages, role whitelist
- **Firestore rules** — tier field cannot be set by client, designs owned by userId
- **Secret redaction** — tool output scanned for API keys/tokens before context (Hermes built-in)

## Recent Updates (June 2026)

### Performance
- Code-split Three.js DrapeView (500KB) — only loads on 3D Drape tab
- DesignDrop lazy-loaded (3.65KB separate chunk)
- Main bundle: 1,364KB → 857KB (37% reduction)
- DrapeView texture debounced (100ms)
- History capped at 50 entries

### Bug Fixes
- **P0:** Firestore rules — fixed collection path (top-level `/designs` with `userId` filter)
- **P0:** Removed hardcoded OpenRouter API key from `vite.config.js`
- **P1:** Rate limiter — now verifies Firebase JWT instead of trusting `X-User-Id` header
- **P1:** VoiceControl — fixed stale closure in SpeechRecognition `useEffect`
- **P2:** DesignDrop — batched API calls (2 concurrent instead of 6 parallel)
- **P2:** Migrated LoginPage + UpgradeModal from inline styles to CSS classes
- **P3:** Extracted shared constants to `src/constants.js`
- **P3:** Fixed satin5 weave matrix to proper 5-end lift plan

## Related

- [[ML-From-Scratch/01 - ML Learning System]] — ML/DL/LLM learning curriculum (separate project)
- [[Project-Overview/01 - Project Overview]] — what Dobby Studio is and where to start

---
*Last updated: 2026-06-23*
