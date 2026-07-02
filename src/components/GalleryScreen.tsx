import { useState, useCallback } from 'react'
import { BonusReward, Child, Screen } from '../types'
import { getRewardImagesForUniverse } from '../data/rewardImages'
import { ACTIVE_UNIVERSES, getUniverse } from '../data/universes'
import { daysUntilNextUnlock, ownedUniverseIds, pendingUniverseChoices } from '../data/universeProgress'
import { rarityOf } from '../data/rarity'
import { bonusStatusFor } from '../data/bonusRewards'
import { childTextColor, tint } from '../theme'
import { ScreenHeader } from './ui'

interface GalleryScreenProps {
  children: Child[]
  galleryChildId: string | null
  galleryReturnScreen: Screen | null
  bonusRewards: BonusReward[]
  setCurrentScreen: (screen: Screen) => void
  setGalleryChildId: (id: string | null) => void
  setGalleryReturnScreen: (screen: Screen | null) => void
}

export default function GalleryScreen({
  children,
  galleryChildId,
  galleryReturnScreen,
  bonusRewards,
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

  // Une section par univers possédé (collection séparée, sur la même page)
  const sections = ownedUniverseIds(currentChild, currentChildIndex)
    .map(id => ({ universe: getUniverse(id), images: getRewardImagesForUniverse(id) }))
    .filter((s): s is { universe: NonNullable<typeof s.universe>; images: typeof s.images } =>
      !!s.universe && s.images.length > 0)

  const allImages = sections.flatMap(s => s.images)
  const totalUnlocked = allImages.filter(img => currentChild.unlockedImages.includes(img.id)).length
  const fullscreenImage = selectedImage ? allImages.find(r => r.id === selectedImage) : null

  const pending = pendingUniverseChoices(currentChild, currentChildIndex, ACTIVE_UNIVERSES.length)
  const daysLeft = daysUntilNextUnlock(currentChild, currentChildIndex, ACTIVE_UNIVERSES.length)

  return (
    <div className="h-full flex flex-col p-6">
      <ScreenHeader
        className="mb-4"
        onBack={handleBack}
        title={
          <>
            Collection {/^[aàâeéèêiîoôuûyh]/i.test(currentChild.name) ? "d'" : 'de '}
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

      {/* Sections par univers — une seule page scrollable */}
      <div className="flex-1 overflow-y-auto scroll-touch">
        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map(({ universe, images }) => {
            const sectionUnlocked = images.filter(img => currentChild.unlockedImages.includes(img.id)).length
            return (
              <section key={universe.id}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-lg font-display font-semibold text-ink">
                    {universe.emoji} {universe.name}
                  </h2>
                  <span className="text-sm font-display text-ink-faint shrink-0">
                    {sectionUnlocked} / {images.length}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {images.map((image, index) => {
                    const unlocked = currentChild.unlockedImages.includes(image.id)
                    const rarity = rarityOf(image.id)
                    const frame = unlocked
                      ? rarity === 'legendaire'
                        ? 'bg-white shadow-card border-2 border-honey-400 ring-2 ring-honey-300 active:scale-95 cursor-pointer'
                        : rarity === 'rare'
                          ? 'bg-white shadow-card border-2 border-honey-300 active:scale-95 cursor-pointer'
                          : 'bg-white shadow-card border-2 border-line active:scale-95 cursor-pointer'
                      : rarity === 'legendaire'
                        ? 'bg-honey-100/80 border-2 border-honey-200 cursor-default'
                        : 'bg-warm-200/70 border-2 border-line cursor-default'
                    return (
                      <button
                        key={image.id}
                        onClick={unlocked ? () => openImage(image.id) : undefined}
                        className={`relative aspect-square rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-200 ${frame}`}
                      >
                        {unlocked ? (
                          <>
                            <img src={image.src} alt={`${universe.name} — image ${index + 1} de la collection de ${currentChild.name}`} className="w-full h-full object-cover rounded-xl" />
                            {rarity !== 'commune' && (
                              <span
                                className="absolute top-1 right-1 text-base drop-shadow"
                                role="img"
                                aria-label={rarity === 'legendaire' ? 'Image légendaire' : 'Image rare'}
                              >
                                {rarity === 'legendaire' ? '🌟' : '✨'}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-4xl opacity-30" role="img" aria-label="Image encore verrouillée">🔒</span>
                            {rarity === 'legendaire' && (
                              <span className="absolute top-1 right-1 text-base opacity-60" aria-hidden="true">🌟</span>
                            )}
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>
      </div>

      {/* Compteur global + progression vers le prochain univers */}
      <div className="text-center mt-4">
        <span className="text-ink-faint text-lg font-display">
          {totalUnlocked} / {allImages.length} images
          {currentChild.completedCycles > 0 && (
            <span className="ml-2 text-honey-500 font-semibold">
              ({currentChild.completedCycles} {currentChild.completedCycles === 1 ? 'cycle' : 'cycles'})
            </span>
          )}
        </span>
        {pending > 0 ? (
          <p className="text-sm font-display font-semibold text-honey-600 mt-1">🎁 Tu as un nouvel univers à choisir !</p>
        ) : daysLeft !== null && daysLeft > 0 ? (
          <p className="text-sm text-ink-faint mt-1">
            ✨ Termine toutes tes routines pendant encore {daysLeft} jour{daysLeft > 1 ? 's' : ''} pour débloquer un nouvel univers
          </p>
        ) : null}
        {(() => {
          const { reached, next } = bonusStatusFor(currentChild, bonusRewards)
          if (reached.length > 0) {
            return (
              <p className="text-sm font-display font-semibold text-success-600 mt-1">
                🎁 Tu as gagné : {reached.map(b => `${b.emoji} ${b.label}`).join(' · ')} — va le dire à un parent !
              </p>
            )
          }
          if (next) {
            return (
              <p className="text-sm text-ink-faint mt-1">
                {next.bonus.emoji} Encore {next.remaining} image{next.remaining > 1 ? 's' : ''} pour gagner : {next.bonus.label}
              </p>
            )
          }
          return null
        })()}
      </div>

      {/* Image plein écran */}
      {fullscreenImage && (
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
              src={fullscreenImage.src}
              alt={`Image de la collection de ${currentChild.name} en plein écran`}
              className="max-w-[95vw] max-h-[90vh] object-contain"
              draggable={false}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
