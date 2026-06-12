import { useState, useRef, useEffect } from 'react'

/**
 * VoiceControl — mic button that uses Web Speech API to transcribe voice input.
 * Calls onTranscript(text) when speech is recognized.
 * FIX #3: Created and wired into ChatPanel.
 */
export default function VoiceControl({ onTranscript, disabled }) {
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      setSupported(true)
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.interimResults = false
      rec.lang = 'en-US'

      rec.onresult = (e) => {
        const transcript = e.results[0]?.[0]?.transcript || ''
        if (transcript.trim()) onTranscript(transcript.trim())
      }

      rec.onend = () => setListening(false)
      rec.onerror = () => setListening(false)

      recognitionRef.current = rec
    }
  }, [])

  if (!supported) return null

  const toggle = () => {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
    } else {
      recognitionRef.current?.start()
      setListening(true)
    }
  }

  return (
    <button
      className={`btn-attach${listening ? ' btn-voice-active' : ''}`}
      disabled={disabled}
      onClick={toggle}
      title={listening ? 'Stop recording' : 'Voice input'}
      aria-label={listening ? 'Stop voice recording' : 'Start voice input'}
    >
      {listening ? (
        // Recording indicator — pulsing mic
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <rect x="9" y="2" width="6" height="12" rx="3" fill="#ef4444"/>
          <path d="M5 10a7 7 0 0 0 14 0" stroke="#ef4444" strokeWidth="2" fill="none"/>
          <line x1="12" y1="19" x2="12" y2="22" stroke="#ef4444" strokeWidth="2"/>
          <line x1="9" y1="22" x2="15" y2="22" stroke="#ef4444" strokeWidth="2"/>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
          <rect x="9" y="2" width="6" height="12" rx="3"/>
          <path d="M5 10a7 7 0 0 0 14 0"/>
          <line x1="12" y1="19" x2="12" y2="22"/>
          <line x1="9" y1="22" x2="15" y2="22"/>
        </svg>
      )}
    </button>
  )
}
