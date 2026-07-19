---
title: VoiceControl Component
type: module-doc
tags: [react, voice, speech, web-speech-api]
status: active
date: 2026-06-23
---

# VoiceControl Component

**File:** `src/components/VoiceControl.jsx`

Microphone button using Web Speech API for voice-to-text input.

## Props

```ts
{
  onTranscript: (text: string) => void,
  disabled: boolean,
}
```

## Features

- **Browser Detection** — Only renders if `SpeechRecognition` or `webkitSpeechRecognition` exists
- **Visual Feedback** — Pulsing red mic icon when recording
- **One-shot Mode** — `continuous: false`, `interimResults: false`
- **Language** — Fixed `en-US`

## API

```js
const rec = new SpeechRecognition()
rec.continuous = false
rec.interimResults = false
rec.lang = 'en-US'
rec.onresult = (e) => onTranscript(e.results[0][0].transcript)
```

## Browser Support

- Chrome: Full support
- Edge: Full support
- Firefox: Partial (may need `media.webspeech.recognition.enable`)
- Safari: Partial (webkit prefix)
