import { useEffect, useState } from 'react'
import { RewardImage } from '../types'
import { Button, Overlay } from './ui'

interface CelebrationOverlayProps {
  childName: string
  reward: RewardImage | null
  onClose: () => void
}

export default function CelebrationOverlay({ childName, reward, onClose }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, 5000)
    return () => clearTimeout(timer)
  }, [onClose])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <Overlay visible={visible} dim="medium" onBackdropClick={handleClose} cardClassName="p-10 max-w-md w-full">
      {reward && (
        <div className="mb-4 flex justify-center">
          <img
            src={reward.src}
            alt="Nouvelle image débloquée"
            className="w-48 h-48 object-contain rounded-2xl animate-bounce"
          />
        </div>
      )}
      <h2 className="text-3xl font-display font-semibold text-ink mb-2">
        Bravo {childName} !
      </h2>
      <p className="text-lg text-ink-soft mb-1">Tu as tout terminé !</p>
      <p className="text-lg font-display font-semibold text-success-500 mb-6">
        {reward ? 'Tu as gagné une nouvelle image !' : 'Quelle belle journée !'}
      </p>
      <Button variant="primary" size="lg" className="px-8 rounded-full" onClick={handleClose}>
        Super !
      </Button>
    </Overlay>
  )
}
