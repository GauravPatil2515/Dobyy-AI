import { useEffect, useState } from 'react'
import { subscribeToasts } from '../utils/toast.js'

export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    return subscribeToasts(({ type, id, message, kind }) => {
      if (type === 'add') {
        setToasts(prev => [...prev, { id, message, kind }])
      } else {
        setToasts(prev => prev.filter(t => t.id !== id))
      }
    })
  }, [])

  if (!toasts.length) return null

  return (
    <div className="toaster">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.kind}`}>{t.message}</div>
      ))}
    </div>
  )
}
