m# 🗺️ Map of Content — Dobby Studio

> Central index for the Dobby Studio project documentation.

---

## 📋 Overview
- [[Welcome]] — Project summary, features, quick start, architecture overview

---

## 🏗️ Architecture
- [[Architecture/State Management]] — useReducer, undo/redo history, skipDepth pattern
- [[Architecture/Rendering Pipeline]] — 5-pass canvas rendering, weave matrices, fiber noise
- [[Architecture/AI Pipeline]] — NLP engine → Groq LLM → Image analysis (OpenRouter Vision)
- [[Architecture/Security]] — Rate limiting, CORS, Firestore rules, input sanitization

---

## 🧩 Components
- [[Components/Header]] — Logo, undo/redo, language switcher, profile dropdown
- [[Components/Sidebar]] — SettBuilder, Gallery, RegistrySearch, Presets, Weave controls
- [[Components/FabricCanvas]] — 4 view modes (Fabric/Draft/Peg/Drape), export buttons, zoom
- [[Components/ChatPanel]] — AI assistant, context chips, voice input, image upload
- [[Components/SettBuilder]] — Drag-and-drop stripe editor, color picker, thread count
- [[Components/DesignDrop]] — AI variations modal (lazy-loaded)
- [[Components/DrapeView]] — Three.js 3D cloth simulation (lazy-loaded, code-split)
- [[Components/Gallery]] — Save/load/rename/delete designs
- [[Components/RegistrySearch]] — Scottish Tartans Authority API integration
- [[Components/VoiceControl]] — Web Speech API
- [[Components/LandingPage]] — Animated intro screen
- [[Components/LoginPage]] — Google auth + demo mode
- [[Components/UpgradeModal]] — Pro tier upsell

---

## 🔌 API & Backend
- [[API/Chat Proxy]] — `/api/chat` — Groq LLM proxy with rate limiting
- [[API/OpenRouter Proxy]] — `/api/openrouter` — Vision API proxy
- [[API/Firestore Rules]] — Security rules for /users and /designs collections

---

## 🛠️ Guides
- [[Guides/Setup]] — Installation, environment, development workflow
- [[Guides/Deployment]] — Vercel deployment, env vars, serverless functions
- [[Guides/Export Formats]] — PNG, JSON, WIF, PDF Tech Sheet specs
- [[Guides/Adding Weave Types]] — How to add a new weave pattern
- [[Guides/Contributing]] — Code style, PR process, bug fix workflow

---

## 📊 Data
- [[Data/Presets]] — 8 classic tartan presets (Royal Stewart, Black Watch, etc.)
- [[Data/Colors]] — Named color → hex mapping (40+ textile colors)
- [[Data/i18n]] — Supported languages (en, hi, gu)

---

## 🔧 Utils
- [[Utils/groqClient]] — Groq LLM client + system prompt
- [[Utils/nlpEngine]] — Local NLP for presets/colors/weaves
- [[Utils/weaveUtils]] — Weave matrices, expandSett, fiber canvas, WIF tieup
- [[Utils/colorUtils]] — h2r, blend, lighter/darker, toRgba
- [[Utils/imageAnalyzer]] — Image resize, k-means fallback, Groq Vision
- [[Utils/pdfExport]] — PDF Tech Sheet generation
- [[Utils/pantoneData]] — Pantone TCX nearest-match (200 colors)
- [[Utils/tartanRegistry]] — Scottish Tartans Authority API client
- [[Utils/shareUtils]] — URL share link encoding/decoding

---

*Last updated: 2026-06-23*
