---
title: Setup Guide
type: module-doc
tags: [setup, installation, development, environment]
status: active
date: 2026-06-23
---

# Setup Guide

## Prerequisites

- Node.js 18+
- npm or pnpm
- A Firebase project (free tier works)
- Groq API key (free tier: 100k tokens/day)
- OpenRouter API key (optional, for image analysis)

## Installation

```bash
cd ~/Desktop/gaurav\ code\ /Project\Academic\ mini-dobby
npm install
```

## Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required values:

```env
# Firebase (client-side, safe to expose)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:000:web:xxxx
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Groq (server-side proxy)
VITE_GROQ_API_KEY=gsk_your_groq_key

# OpenRouter (image analysis)
VITE_OPENROUTER_API_KEY=sk-or-your-openrouter-key
```

## Development

```bash
npm run dev
```

Opens at http://localhost:5173 with API proxy:
- `/api/chat` → proxied to `api.groq.com`
- `/api/openrouter` → proxied to `openrouter.ai`

## Build

```bash
npm run build
npm run preview
```

## Vercel Deployment

1. Connect GitHub repo to Vercel
2. Set environment variables (server-side):
   - `GROQ_API_KEY`
   - `OPENROUTER_KEY`
   - `ALLOWED_ORIGIN=https://your-domain.vercel.app`
   - `FIREBASE_PROJECT_ID=your-project-id`
3. Deploy

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 18 + Vite 5 |
| State | useReducer + useRef (undo/redo) |
| Styling | CSS custom properties (design tokens) |
| Auth | Firebase Auth (Google + Anonymous) |
| Database | Firestore (persistent local cache) |
| AI/LLM | Groq (llama3-8b-8192) |
| Vision | OpenRouter (llama-4-maverick) |
| 3D | Three.js (cloth simulation) |
| Export | Canvas API, window.print() |
| i18n | Custom (en/hi/gu) |
