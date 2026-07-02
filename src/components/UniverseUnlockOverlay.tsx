import { Child } from '../types'
import { ACTIVE_UNIVERSES } from '../data/universes'
import { getRewardImagesForUniverse } from '../data/rewardImages'
import { childTextColor } from '../theme'
import { Overlay } from './ui'

interface UniverseUnlockOverlayProps {
  child: Child
  /** Univers déjà possédés par l'enfant — exclus du choix. */
  ownedIds: string[]
  onPick: (universeId: string) => void
  onLater: () => void
}

/**
 * Choix (côté enfant) d'un nouvel univers gagné par la progression.
 * Volontairement doux : pas de compte à rebours, « Plus tard » toujours possible.
 */
export default function UniverseUnlockOverlay({ child, ownedIds, onPick, onLater }: UniverseUnlockOverlayProps) {
  const choices = ACTIVE_UNIVERSES.filter(u => !ownedIds.includes(u.id))
  if (choices.length === 0) return null

  return (
    <Overlay dim="medium" onBackdropClick={onLater} cardClassName="p-8 max-w-2xl w-full">
      <div className="text-6xl mb-3" role="img" aria-label="Cadeau">🎁</div>
      <h2 className="text-3xl font-display font-semibold text-ink mb-2">
        Bravo <span style={{ color: childTextColor(child.color) }}>{child.name}</span> !
      </h2>
      <p className="text-lg text-ink-soft mb-6">
        Tes routines réussies t'ont fait gagner un nouvel univers.<br />Choisis ta nouvelle collection :
      </p>

      {/* Avec 8 univers le choix peut être long : zone scrollable, l'overlay reste dans l'écran */}
      <div className={`grid gap-3 mb-6 max-h-[52vh] overflow-y-auto scroll-touch ${choices.length >= 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {choices.map(universe => {
          const thumbnail = getRewardImagesForUniverse(universe.id)[0]?.src
          return (
            <button
              key={universe.id}
              onClick={() => onPick(universe.id)}
              className="rounded-2xl border-2 border-line bg-white shadow-card overflow-hidden flex flex-col items-center text-center active:scale-95 transition-transform hover:border-honey-300"
            >
              {thumbnail && (
                <img src={thumbnail} alt="" aria-hidden="true" className="w-full aspect-square object-cover" />
              )}
              <div className="p-3">
                <span className="block text-2xl mb-1" aria-hidden="true">{universe.emoji}</span>
                <span className="font-display font-semibold text-ink text-sm leading-tight">{universe.name}</span>
              </div>
            </button>
          )
        })}
      </div>

      <button onClick={onLater} className="w-full min-h-12 py-3 text-ink-faint font-semibold active:scale-95 transition-transform">
        Plus tard
      </button>
    </Overlay>
  )
}
