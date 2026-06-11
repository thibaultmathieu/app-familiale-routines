import { Child, Screen } from '../types'
import ChildAvatar from './ChildAvatar'
import { getRewardImagesForUniverse, resolveUniverseId } from '../data/rewardImages'
import { UNIVERSES } from '../data/universes'
import { childTextColor, tint } from '../theme'
import { Card, ScreenHeader } from './ui'

interface UniverseSelectScreenProps {
  children: Child[]
  setCurrentScreen: (screen: Screen) => void
  setChildUniverse: (childId: string, universeId: string) => void
}

/**
 * Choix de l'univers de récompenses par enfant (fondations Jalon 2).
 * Changer d'univers ne perd aucune progression : les images débloquées de
 * chaque univers restent acquises (intersection unlockedImages ∩ pool).
 */
export default function UniverseSelectScreen({
  children,
  setCurrentScreen,
  setChildUniverse,
}: UniverseSelectScreenProps) {
  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <ScreenHeader className="mb-3" onBack={() => setCurrentScreen('parent')} title="🌌 Univers des récompenses" />
      <p className="text-sm text-ink-faint text-center mb-6">
        Chaque enfant collectionne les images de son univers. Changer d'univers ne fait rien perdre :
        les images déjà gagnées restent acquises.
      </p>

      <div className="space-y-5">
        {children.map((child, childIndex) => {
          const currentUniverseId = resolveUniverseId(child, childIndex)
          return (
            <Card key={child.id} className="p-5">
              {/* Enfant */}
              <div className="flex items-center gap-3 mb-4">
                <div className="border-[3px] rounded-full" style={{ borderColor: child.color }}>
                  <ChildAvatar photo={child.photo} color={child.color} size={44} />
                </div>
                <h2 className="text-lg font-display font-bold" style={{ color: childTextColor(child.color) }}>
                  {child.name}
                </h2>
              </div>

              {/* Univers */}
              <div className="grid grid-cols-2 gap-3">
                {UNIVERSES.map(universe => {
                  const pool = getRewardImagesForUniverse(universe.id)
                  const isAvailable = !universe.comingSoon && pool.length > 0
                  const isSelected = currentUniverseId === universe.id
                  const unlockedInUniverse = child.unlockedImages.filter(id =>
                    pool.some(img => img.id === id)
                  ).length

                  return (
                    <button
                      key={universe.id}
                      onClick={isAvailable && !isSelected ? () => setChildUniverse(child.id, universe.id) : undefined}
                      disabled={!isAvailable}
                      aria-pressed={isSelected}
                      className={`relative rounded-2xl border-2 p-4 flex flex-col items-center gap-1 text-center transition-all min-h-28
                        ${isSelected
                          ? 'shadow-card'
                          : isAvailable
                            ? 'bg-white border-line shadow-card active:scale-95 cursor-pointer hover:border-line-strong'
                            : 'bg-warm-100 border-line opacity-70 cursor-default'
                        }`}
                      style={isSelected ? {
                        borderColor: child.color,
                        backgroundColor: tint(child.color, 0.10),
                      } : undefined}
                    >
                      {isSelected && (
                        <span
                          className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-sm flex items-center justify-center"
                          style={{ backgroundColor: childTextColor(child.color) }}
                          role="img"
                          aria-label="Univers sélectionné"
                        >
                          ✓
                        </span>
                      )}
                      {!isAvailable && (
                        <span className="absolute top-2 right-2 text-base" role="img" aria-label="Bientôt disponible">🔒</span>
                      )}
                      <span className="text-3xl" aria-hidden="true">{universe.emoji}</span>
                      <span className="font-display font-semibold text-ink text-sm leading-tight">{universe.name}</span>
                      {isAvailable ? (
                        <span className="text-xs text-ink-faint">
                          {unlockedInUniverse} / {pool.length} images
                        </span>
                      ) : (
                        <span className="text-xs text-ink-faint italic">Bientôt disponible…</span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
      <div className="h-6 shrink-0" />
    </div>
  )
}
