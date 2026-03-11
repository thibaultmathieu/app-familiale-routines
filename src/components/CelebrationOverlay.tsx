import { useEffect, useState } from 'react'
import { RewardImage } from '../types'

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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
    >
      <div
        className="bg-white rounded-3xl p-10 text-center shadow-xl max-w-md mx-4"
        onClick={e => e.stopPropagation()}
      >
        {reward && (
          <div className="mb-4 flex justify-center">
            <img
              src={reward.src}
              alt=""
              className="w-48 h-48 object-contain rounded-2xl animate-bounce"
            />
          </div>
        )}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Bravo {childName} !
        </h2>
        {reward ? (
          <p className="text-lg text-gray-500 mb-6">
            Tu as gagné une nouvelle image !
          </p>
        ) : (
          <p className="text-lg text-gray-500 mb-6">
            Routine terminée !
          </p>
        )}
        <button
          onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
          className="px-8 py-3 bg-green-400 text-white rounded-full text-lg font-medium active:scale-95 transition-transform"
        >
          Super !
        </button>
      </div>
    </div>
  )
}
