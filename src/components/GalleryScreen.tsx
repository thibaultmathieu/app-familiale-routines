import { useState, useCallback } from 'react'
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

  const openImage = useCallback((imageId: string) => {
    setSelectedImage(imageId)
  }, [])

  const closeImage = useCallback(() => {
    setSelectedImage(null)
  }, [])

  const currentChild = children.find(c => c.id === galleryChildId) || children[0]
  const otherChild = currentChild ? children.find(c => c.id !== currentChild.id) : undefined
  const currentChildIndex = currentChild ? children.findIndex(c => c.id === currentChild.id) : -1
  const childImages = getRewardImagesForChild(currentChildIndex >= 0 ? currentChildIndex : 0)

  const handleBack = () => {
    const returnTo = galleryReturnScreen || 'parent'
    setGalleryReturnScreen(null)
    setCurrentScreen(returnTo)
  }

  if (!currentChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-xl text-gray-400 mb-4">Aucun enfant configuré</p>
        <button
          onClick={handleBack}
          className="px-6 py-3 bg-blue-100 text-blue-600 rounded-full text-lg font-medium"
        >
          ← Retour
        </button>
      </div>
    )
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
          {childImages.map((image, index) => {
            const unlocked = currentChild.unlockedImages.includes(image.id)
            return (
              <button
                key={image.id}
                onClick={unlocked ? () => openImage(image.id) : undefined}
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
                  <img src={image.src} alt={`Image ${index + 1} de la collection de ${currentChild.name}`} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-4xl opacity-30" role="img" aria-label="Image encore verrouillée">🔒</span>
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

      {/* Image plein écran avec pinch-to-zoom et pan */}
      {selectedImage && (() => {
        const image = childImages.find(r => r.id === selectedImage)
        if (!image) return null
        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 overflow-hidden"
            onClick={closeImage}
          >
            {/* Close button */}
            <button
              onClick={closeImage}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
            >
              ✕
            </button>
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={image.src}
                alt={`Image de la collection de ${currentChild.name} en plein écran`}
                className="max-w-[95vw] max-h-[90vh] object-contain"
                draggable={false}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
        )
      })()}
    </div>
  )
}
