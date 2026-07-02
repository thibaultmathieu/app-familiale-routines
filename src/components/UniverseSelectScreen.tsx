import { Child, Screen } from '../types'
import ChildAvatar from './ChildAvatar'
import { getRewardImagesForUniverse, resolveUniverseId } from '../data/rewardImages'
import { UNIVERSES, ACTIVE_UNIVERSES } from '../data/universes'
import { daysUntilNextUnlock, ownedUniverseIds, pendingUniverseChoices } from '../data/universeProgress'
import { childTextColor, tint } from '../theme'
import { Card, ScreenHeader } from './ui'

interface UniverseSelectScreenProps {
  children: Child[]
  setCurrentScreen: (screen: Screen) => void
  setChildUniverse: (childId: string, universeId: string) => void
  addChildUniverse: (childId: string, universeId: string) => void
}

/**
 * Univers de récompenses par enfant (côté parents).
 * L'enfant possède les univers qu'il a choisis/gagnés ; les autres se
 * débloquent par la progression (un parent peut les offrir en avance).
 * Changer d'univers ne perd aucune progression (intersection unlockedImages ∩ pool).
 */
export default function UniverseSelectScreen({
  children,
  setCurrentScreen,
  setChildUniverse,
  addChildUniverse,
}: UniverseSelectScreenProps) {
  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <ScreenHeader className="mb-3" onBack={() => setCurrentScreen('parent')} title="🌌 Univers des récompenses" />
      <p className="text-sm text-ink-faint text-center mb-6">
        Chaque enfant collectionne les images de ses univers. Il en débloque un nouveau après
        2 journées complètes (toutes les routines du jour terminées), puis tous les 5 jours.
        Rien ne se perd en changeant d'univers.
      </p>

      <div className="space-y-5">
        {children.map((child, childIndex) => {
          const currentUniverseId = resolveUniverseId(child, childIndex)
          const ownedIds = ownedUniverseIds(child, childIndex)
          const pending = pendingUniverseChoices(child, childIndex, ACTIVE_UNIVERSES.length)
          const daysLeft = daysUntilNextUnlock(child, childIndex, ACTIVE_UNIVERSES.length)

          return (
            <Card key={child.id} className="p-5">
              {/* Enfant + progression */}
              <div className="flex items-center gap-3 mb-1">
                <div className="border-[3px] rounded-full" style={{ borderColor: child.color }}>
                  <ChildAvatar photo={child.photo} color={child.color} size={44} />
                </div>
                <h2 className="text-lg font-display font-bold" style={{ color: childTextColor(child.color) }}>
                  {child.name}
                </h2>
              </div>
              <p className="text-xs text-ink-faint mb-4">
                {pending > 0
                  ? `🎁 ${pending > 1 ? `${pending} nouveaux univers gagnés` : 'Nouvel univers gagné'} — votre enfant peut le choisir !`
                  : daysLeft !== null
                    ? `Prochain univers dans ${daysLeft} journée${daysLeft > 1 ? 's' : ''} de routines complètes`
                    : 'Tous les univers sont débloqués ✨'}
              </p>

              {/* Univers */}
              <div className="grid grid-cols-2 gap-3">
                {UNIVERSES.map(universe => {
                  const pool = getRewardImagesForUniverse(universe.id)
                  const hasPool = !universe.comingSoon && pool.length > 0
                  const isOwned = hasPool && ownedIds.includes(universe.id)
                  const isSelected = currentUniverseId === universe.id
                  const unlockedInUniverse = child.unlockedImages.filter(id =>
                    pool.some(img => img.id === id)
                  ).length

                  const handleClick = () => {
                    if (!hasPool || isSelected) return
                    if (isOwned) {
                      setChildUniverse(child.id, universe.id)
                      return
                    }
                    // Univers non gagné : le parent peut l'offrir en avance
                    if (window.confirm(`Débloquer « ${universe.name} » pour ${child.name} maintenant ?\n(Sinon, il se débloquera avec ses routines réussies.)`)) {
                      addChildUniverse(child.id, universe.id)
                    }
                  }

                  return (
                    <button
                      key={universe.id}
                      onClick={handleClick}
                      disabled={!hasPool}
                      aria-pressed={isSelected}
                      className={`relative rounded-2xl border-2 p-4 flex flex-col items-center gap-1 text-center transition-all min-h-28
                        ${isSelected
                          ? 'shadow-card'
                          : isOwned
                            ? 'bg-white border-line shadow-card active:scale-95 cursor-pointer hover:border-line-strong'
                            : hasPool
                              ? 'bg-warm-100 border-line opacity-80 active:scale-95 cursor-pointer'
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
                          aria-label="Univers actif"
                        >
                          ✓
                        </span>
                      )}
                      {!isOwned && (
                        <span className="absolute top-2 right-2 text-base" role="img" aria-label={hasPool ? 'À débloquer' : 'Bientôt disponible'}>🔒</span>
                      )}
                      <span className="text-3xl" aria-hidden="true">{universe.emoji}</span>
                      <span className="font-display font-semibold text-ink text-sm leading-tight">{universe.name}</span>
                      {isOwned ? (
                        <span className="text-xs text-ink-faint">
                          {unlockedInUniverse} / {pool.length} images
                        </span>
                      ) : hasPool ? (
                        <span className="text-xs text-ink-faint italic">Avec les routines (ou offrir)</span>
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
