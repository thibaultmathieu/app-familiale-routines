import { useState } from 'react'
import { Child, Screen } from '../types'
import { getRewardImagesForChild } from '../data/rewardImages'

interface GalleryScreenProps {
  children: Child[]
  galleryChildId: string | null
  galleryReturnScreen: Screen | null
  setCurrentScreen: (screen: Screen) => void
  setGalleryChildId: (id: string | null) => void
  setGalleryReturnScreen: (screen: Screen | null) => void
}

export default function GalleryScreen({
  children,
  galleryChildId,
  galleryReturnScreen,
  setCurrentScreen,
  setGalleryChildId,
  setGalleryReturnScreen,
}: GalleryScreenProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const currentChild = children.find(c => c.id === galleryChildId) || children[0]
  const otherChild = children.find(c => c.id !== currentChild.id)
  const childImages = getRewardImagesForChild(currentChild.id)

  const handleBack = () => {
    const returnTo = galleryReturnScreen || 'parent'
    setGalleryReturnScreen(null)
    setCurrentScreen(returnTo)
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={handleBack}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          Collection de {currentChild.name}
        </h1>
        {otherChild && (
          <button
            onClick={() => setGalleryChildId(otherChild.id)}
            className="text-blue-500 text-lg font-medium px-4 py-2"
          >
            {otherChild.name} →
          </button>
        )}
      </div>

      {/* Grille d'images */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-5 gap-4 max-w-3xl mx-auto">
          {childImages.map(image => {
            const unlocked = currentChild.unlockedImages.includes(image.id)
            return (
              <button
                key={image.id}
                onClick={unlocked ? () => setSelectedImage(image.id) : undefined}
                className={`
                  aspect-square rounded-2xl flex items-center justify-center overflow-hidden
                  transition-all duration-200
                  ${unlocked
                    ? 'bg-white shadow-sm border-2 border-gray-100 active:scale-95 cursor-pointer'
                    : 'bg-gray-100 border-2 border-gray-100 cursor-default'
                  }
                `}
              >
                {unlocked ? (
                  <img src={image.src} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-4xl opacity-30">🔒</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Compteur */}
      <div className="text-center mt-4">
        <span className="text-gray-400 text-lg">
          {currentChild.unlockedImages.length} / {childImages.length} images
          {currentChild.completedCycles > 0 && (
            <span className="ml-2 text-amber-400">
              ({currentChild.completedCycles} {currentChild.completedCycles === 1 ? 'cycle' : 'cycles'})
            </span>
          )}
        </span>
      </div>

      {/* Image plein écran */}
      {selectedImage && (() => {
        const image = childImages.find(r => r.id === selectedImage)
        if (!image) return null
        return (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-8"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="bg-white rounded-3xl p-4 max-w-lg max-h-[80vh] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img src={image.src} alt="" className="max-w-full max-h-[70vh] object-contain rounded-2xl" />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
