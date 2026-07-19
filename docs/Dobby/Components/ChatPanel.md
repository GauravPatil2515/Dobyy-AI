---
title: ChatPanel Component
type: module-doc
tags: [react, chat, ai, ui]
status: active
date: 2026-06-23
---

# ChatPanel Component

**File:** `src/components/ChatPanel.jsx`

Right panel with AI design assistant, live state feed, context chips, and input.

## Props

```ts
{
  state: FabricState,
  dispatch: Dispatch,
  onPrompt: (text: string, onReply: (result) => void) => Promise<void>,
  loading: boolean,
  onLimitExceeded: () => void,
  remainingCalls: number,
  isPro: boolean,
}
```

## Features

- **Welcome Message** — Intro text explaining capabilities
- **Live State Feed** — Color dots, weave type, ts/reps progress bars
- **Intent Chip** — Shows what the last AI action did (e.g., "colors: red, navy")
- **Chat Messages** — User/AI bubbles with typing indicator
- **Context Chips** — 9 suggested prompts based on current state
- **Text Input** — Enter to send, Shift+Enter for newline
- **Image Upload** — Hidden file input, analyzes fabric photos
- **Voice Input** — Web Speech API button (VoiceControl component)
- **Remaining Calls Badge** — Shows daily quota (free tier only)

## Message Flow

1. User types → `send(text)` called
2. Check `canMakeApiCall()` — reject if limit reached
3. Add user message to UI
4. Add typing indicator
5. `await incrementApiCall()` — track usage
6. `await onPrompt(text, callback)` — calls Groq via processPrompt
7. Replace typing with AI reply
8. Update intent chip
