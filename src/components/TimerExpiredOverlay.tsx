import { useEffect, useState } from 'react'
import { ActiveTimer, Child } from '../types'
import { Button, Overlay } from './ui'

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
    <Overlay visible={visible} dim="light" onBackdropClick={handleDismiss} cardClassName="p-8 max-w-md w-full">
      <p className="text-5xl mb-4" role="img" aria-label="Réveil">⏰</p>
      <h2 className="text-2xl font-display font-semibold text-ink mb-2">
        {timer.label}
      </h2>
      <p className="text-lg text-ink-soft mb-1">
        {targetNames}
      </p>
      <p className="text-xl font-display font-semibold text-honey-600 mb-6">
        On termine maintenant !
      </p>
      <Button variant="honey" size="lg" className="px-8 rounded-full" onClick={handleDismiss}>
        C'est fait !
      </Button>
    </Overlay>
  )
}
