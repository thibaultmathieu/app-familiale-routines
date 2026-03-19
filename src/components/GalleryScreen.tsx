import { useState, useRef, useCallback } from 'react'
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

  // Pinch-to-zoom + pan state
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const pinchRef = useRef<{ initialDistance: number; initialScale: number } | null>(null)
  const panRef = useRef<{ lastX: number; lastY: number } | null>(null)

  const openImage = useCallback((imageId: string) => {
    setSelectedImage(imageId)
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [])

  const closeImage = useCallback(() => {
    setSelectedImage(null)
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Start pinch
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = {
        initialDistance: Math.hypot(dx, dy),
        initialScale: transform.scale,
      }
      panRef.current = null
    } else if (e.touches.length === 1 && transform.scale > 1) {
      // Start pan (only when zoomed)
      panRef.current = { lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
      pinchRef.current = null
    }
  }, [transform.scale])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault()
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const distance = Math.hypot(dx, dy)
      const newScale = Math.min(5, Math.max(1, pinchRef.current.initialScale * (distance / pinchRef.current.initialDistance)))
      setTransform(prev => {
        // If zooming back to 1, reset position
        if (newScale <= 1) return { scale: 1, x: 0, y: 0 }
        return { ...prev, scale: newScale }
      })
    } else if (e.touches.length === 1 && panRef.current && transform.scale > 1) {
      e.preventDefault()
      const deltaX = e.touches[0].clientX - panRef.current.lastX
      const deltaY = e.touches[0].clientY - panRef.current.lastY
      panRef.current = { lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
      setTransform(prev => ({ ...prev, x: prev.x + deltaX, y: prev.y + deltaY }))
    }
  }, [transform.scale])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) {
      pinchRef.current = null
      panRef.current = null
    } else if (e.touches.length === 1) {
      // Switched from pinch to single finger — start pan
      pinchRef.current = null
      if (transform.scale > 1) {
        panRef.current = { lastX: e.touches[0].clientX, lastY: e.touches[0].clientY }
      }
    }
  }, [transform.scale])

  const currentChild = children.find(c => c.id === galleryChildId) || children[0]
  const otherChild = children.find(c => c.id !== currentChild.id)
  const currentChildIndex = children.findIndex(c => c.id === currentChild.id)
  const childImages = getRewardImagesForChild(currentChildIndex >= 0 ? currentChildIndex : 0)

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

      {/* Image plein écran avec pinch-to-zoom et pan */}
      {selectedImage && (() => {
        const image = childImages.find(r => r.id === selectedImage)
        if (!image) return null
        return (
          <div
            className="fixed inset-0 z-50 bg-black/80 overflow-hidden"
            onClick={transform.scale <= 1 ? closeImage : undefined}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Close button — always visible */}
            <button
              onClick={closeImage}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white text-xl flex items-center justify-center"
            >
              ✕
            </button>
            {/* Image container — scales and translates as a whole */}
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={image.src}
                alt=""
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
