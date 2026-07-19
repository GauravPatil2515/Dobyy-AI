---
title: Deployment Guide
type: module-doc
tags: [deployment, vercel, serverless, env-vars]
status: active
date: 2026-06-23
---

# Deployment Guide

## Platform: Vercel

The project is deployed to Vercel with serverless functions.

### Build Settings

- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Node Version:** 18+

### Serverless Functions

| Route | Handler | Memory | Timeout |
|-------|---------|--------|---------|
| `/api/chat` | `api/chat.js` | 1024MB | 30s |
| `/api/openrouter` | `api/openrouter.js` | 1024MB | 60s |
| `/api/groq/[...path]` | `api/groq/[...path].js` | 1024MB | 30s |

### Environment Variables (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Server-side Groq API key |
| `OPENROUTER_KEY` | Yes | Server-side OpenRouter key |
| `ALLOWED_ORIGIN` | Yes | CORS origin (https://your-domain.vercel.app) |
| `FIREBASE_PROJECT_ID` | Yes | For token verification |

### Client Env Vars (Vite)

These are inlined at build time (safe to expose):

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase public key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase analytics |
| `VITE_GROQ_API_KEY` | Dev proxy only (not used in production) |
| `VITE_OPENROUTER_API_KEY` | Dev proxy only (not used in production) |

### Deployment Steps

1. Push to GitHub
2. Import project in Vercel
3. Set all environment variables
4. Deploy
5. Add custom domain (optional)

### Post-Deploy

- Verify `/api/chat` returns 405 for GET (not 404)
- Test CORS with curl from different origin
- Check Firestore rules in Firebase Console → Rules tab
