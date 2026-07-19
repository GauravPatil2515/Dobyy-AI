# Project Overview — Dobby Studio

Dobby Studio is an AI-powered fabric & tartan design tool. A user describes a
tartan or fabric in natural language (or uploads a photo), a Groq LLM generates
the **sett** (stripe pattern), and a canvas renderer produces a thread-level
woven-fabric visualization with loom-ready technical exports for mills.

- **Live app:** https://dobyy-ai.vercel.app
- **Repository:** GauravPatil2515/Dobyy-AI
- **Stack:** React 18 + Vite · Three.js (3D drape) · Firebase (Auth/Firestore/Analytics) · Groq (chat) · OpenRouter (vision) · Vercel serverless proxies.

## Where to start

- [[Welcome]] — orientation map and recent updates.
- [[Architecture/State Management]] — single `useReducer` in `useFabricState.js`, 11 actions, undo/redo via a capped history ref.
- [[Architecture/AI Pipeline]] — 3 tiers: local NLP → Groq LLM → OpenRouter vision, each behind a server proxy.
- [[Architecture/Rendering Pipeline]] — 5–6 pass canvas render (optical blend, twill strokes, shadow grid, fiber noise, vignette).
- [[Architecture/Security]] — Firebase JWT verification + per-uid rate limiting on both API proxies.

## Core concepts

- **Sett** — ordered list of colored stripes `{ c: hex, n: threadCount }` that defines a tartan.
- **Weave** — interlacing structure (7 types: twill22, twill21, plain, satin5, twill31, basket2, hopsack).
- **Thread size (ts)** — px per thread (4–22). **Repeats (reps)** — how many times the sett tiles (1–12).
- **Exports** — PNG, JSON, WIF (loom tieup), PDF tech sheet with Pantone TCX matching.

## Tiers

- **Free** — 5 AI calls/day, 20 saved designs, no WIF export.
- **Pro** ($9/mo) — 100 calls/day, 200 designs, WIF + unlimited variations.
  Tier is derived server-side from the verified Firebase token's custom claim.

> Note: this vault documents Dobby Studio only. The earlier "ISRO Aditya-L1 flare
> forecasting" reference in [[Welcome]] was a stray cross-vault link and has been
> removed.
