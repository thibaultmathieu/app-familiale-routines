import { useState, useCallback } from 'react'
import { Child, Screen } from '../types'
import { getRewardImagesForChildEntry, resolveUniverseId } from '../data/rewardImages'
import { getUniverse } from '../data/universes'
import { childTextColor, tint } from '../theme'
import { ScreenHeader } from './ui'

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
  const childImages = currentChild ? getRewardImagesForChildEntry(currentChild, currentChildIndex) : []
  const universeId = currentChild ? resolveUniverseId(currentChild, currentChildIndex) : null
  const universe = universeId ? getUniverse(universeId) : undefined

  const handleBack = () => {
    const returnTo = galleryReturnScreen || 'parent'
    setGalleryReturnScreen(null)
    setCurrentScreen(returnTo)
  }

  if (!currentChild) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <p className="text-xl text-ink-faint mb-4">Aucun enfant configuré</p>
        <button
          onClick={handleBack}
          className="min-h-12 px-6 py-3 bg-warm-100 text-ink-soft rounded-full text-lg font-display font-medium active:scale-95 transition-transform"
        >
          ← Retour
        </button>
      </div>
    )
  }

  const unlockedCount = childImages.filter(img => currentChild.unlockedImages.includes(img.id)).length

  return (
    <div className="h-full flex flex-col p-6">
      <ScreenHeader
        className="mb-4"
        onBack={handleBack}
        title={
          <>
            Collection de{' '}
            <span style={{ color: childTextColor(currentChild.color) }}>{currentChild.name}</span>
          </>
        }
        right={
          otherChild ? (
            <button
              onClick={() => setGalleryChildId(otherChild.id)}
              className="min-h-12 px-5 py-2 rounded-full text-base font-display font-semibold active:scale-95 transition-transform"
              style={{
                color: childTextColor(otherChild.color),
                backgroundColor: tint(otherChild.color, 0.12),
              }}
            >
              {otherChild.name} →
            </button>
          ) : undefined
        }
      />

      {/* Univers courant */}
      {universe && (
        <p className="text-center text-sm font-display font-medium text-ink-faint mb-4 -mt-2">
          {universe.emoji} {universe.name}
        </p>
      )}

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
                    ? 'bg-white shadow-card border-2 border-line active:scale-95 cursor-pointer'
                    : 'bg-warm-200/70 border-2 border-line cursor-default'
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
        <span className="text-ink-faint text-lg font-display">
          {unlockedCount} / {childImages.length} images
          {currentChild.completedCycles > 0 && (
            <span className="ml-2 text-honey-500 font-semibold">
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
            className="fixed inset-0 z-modal bg-black/80 overflow-hidden"
            onClick={closeImage}
          >
            {/* Close button */}
            <button
              onClick={closeImage}
              className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/50 text-white text-xl flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Fermer l'image"
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
