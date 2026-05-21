// useLandingGate — isolates sessionStorage landing logic out of App.jsx
import { useState } from 'react'

export function useLandingGate() {
  const [showLanding, setShowLanding] = useState(
    () => !sessionStorage.getItem('dobby-entered')
  )
  function handleEnter() {
    sessionStorage.setItem('dobby-entered', '1')
    setShowLanding(false)
  }
  return { showLanding, handleEnter }
}
