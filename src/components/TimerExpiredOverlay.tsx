import { useEffect, useState } from 'react'
import { ActiveTimer, Child } from '../types'

interface TimerExpiredOverlayProps {
  timer: ActiveTimer
  children: Child[]
  onDismiss: () => void
}

export default function TimerExpiredOverlay({ timer, children, onDismiss }: TimerExpiredOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const autoClose = setTimeout(() => {
      setVisible(false)
      setTimeout(onDismiss, 300)
    }, 30000)
    return () => clearTimeout(autoClose)
  }, [onDismiss])

  const targetNames = timer.childIds
    .map(id => children.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(' & ')

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(onDismiss, 300)
  }

  return (
    <div
      className={`fixed inset-0 z-40 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      onClick={handleDismiss}
    >
      <div
        className="bg-white rounded-3xl p-8 text-center shadow-xl max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        <p className="text-5xl mb-4">⏰</p>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {timer.label}
        </h2>
        <p className="text-lg text-gray-500 mb-1">
          {targetNames}
        </p>
        <p className="text-xl font-semibold text-amber-600 mb-6">
          On termine maintenant !
        </p>
        <button
          onClick={handleDismiss}
          className="px-8 py-3 bg-amber-400 text-white rounded-full text-lg font-medium active:scale-95 transition-transform"
        >
          C'est fait !
        </button>
      </div>
    </div>
  )
}
