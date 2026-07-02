import { useEffect, useMemo, useRef, useState } from 'react'
import { RewardImage } from '../types'
import { rarityOf, RARITY_META } from '../data/rarity'
import { Button, Overlay } from './ui'

interface CelebrationOverlayProps {
  childName: string
  reward: RewardImage | null
  onClose: () => void
}

/** Durées du rituel : révélation automatique si l'enfant n'ose pas toucher,
 * puis fermeture douce une fois l'image admirée. */
const AUTO_REVEAL_MS = 15000
const AUTO_CLOSE_AFTER_REVEAL_MS = 7000

const CONFETTI_COLORS = ['#F4B23F', '#7CC08D', '#8E7CC3', '#F08E7D', '#6FB5E8', '#F5D06B']

function ConfettiBurst({ count }: { count: number }) {
  // Positions/rotations aléatoires figées au premier rendu (visuel uniquement)
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        x: (Math.random() - 0.5) * 160,
        spin: 360 + Math.random() * 540,
        duration: 1.8 + Math.random() * 1.4,
        delay: Math.random() * 0.35,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      })),
    [count]
  )
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            ['--confetti-x' as string]: `${p.x}px`,
            ['--confetti-spin' as string]: `${p.spin}deg`,
            ['--confetti-duration' as string]: `${p.duration}s`,
            ['--confetti-delay' as string]: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Célébration de fin de routine — rituel de révélation : l'image gagnée arrive
 * face cachée, l'enfant touche la carte pour la retourner (suspense !), les
 * confettis saluent la découverte — d'autant plus fort que l'image est rare.
 */
export default function CelebrationOverlay({ childName, reward, onClose }: CelebrationOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const revealedRef = useRef(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const rarity = reward ? rarityOf(reward.id) : 'commune'
  const rarityMeta = RARITY_META[rarity]

  const scheduleClose = (delay: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, delay)
  }

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sans image (pool vide) : message simple, fermeture automatique comme avant
  useEffect(() => {
    if (!reward) scheduleClose(5000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward])

  // L'enfant n'a pas touché la carte : on révèle pour lui au bout d'un moment
  useEffect(() => {
    if (!reward || revealed) return
    const t = setTimeout(() => handleReveal(), AUTO_REVEAL_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reward, revealed])

  const handleReveal = () => {
    if (revealedRef.current) return
    revealedRef.current = true
    setRevealed(true)
    scheduleClose(AUTO_CLOSE_AFTER_REVEAL_MS)
  }

  const handleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setVisible(false)
    setTimeout(onClose, 300)
  }

  const confettiCount = rarity === 'legendaire' ? 46 : rarity === 'rare' ? 32 : 20

  return (
    <Overlay
      visible={visible}
      dim="medium"
      onBackdropClick={reward && !revealed ? handleReveal : handleClose}
      cardClassName="p-8 max-w-md w-full"
    >
      {revealed && <ConfettiBurst count={confettiCount} />}

      <h2 className="text-3xl font-display font-semibold text-ink mb-1">
        Bravo {childName} !
      </h2>
      <p className="text-lg text-ink-soft mb-4">Tu as tout terminé !</p>

      {reward ? (
        <>
          {/* Carte à retourner */}
          <div className="perspective-1000 mx-auto mb-4 w-52 h-52">
            <button
              onClick={handleReveal}
              disabled={revealed}
              aria-label={revealed ? 'Image découverte' : 'Retourner la carte pour découvrir ton image'}
              className={`relative w-full h-full preserve-3d transition-transform duration-700 ${revealed ? '' : 'animate-card-wiggle'}`}
              style={{ transform: revealed ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
            >
              {/* Dos de la carte */}
              <div className="absolute inset-0 backface-hidden rounded-3xl bg-gradient-to-br from-honey-400 to-honey-600 border-4 border-white shadow-raised flex flex-col items-center justify-center gap-2">
                <span className="text-6xl" aria-hidden="true">🎁</span>
                <span className="text-white font-display font-bold text-lg drop-shadow">Touche-moi !</span>
              </div>
              {/* Face image */}
              <div
                className={`absolute inset-0 backface-hidden rounded-3xl bg-white
                  ${rarity === 'legendaire' ? 'ring-4 ring-honey-400' : rarity === 'rare' ? 'ring-4 ring-honey-300' : 'border-4 border-white shadow-raised'}`}
                style={{ transform: 'rotateY(180deg)' }}
              >
                {rarity === 'legendaire' && revealed && <div className="legendary-halo" aria-hidden="true" />}
                <img src={reward.src} alt="Nouvelle image débloquée" className="w-full h-full object-cover rounded-3xl" />
              </div>
            </button>
          </div>

          {revealed ? (
            <>
              {rarity !== 'commune' && (
                <p className={`font-display font-bold text-lg mb-1 ${rarity === 'legendaire' ? 'text-honey-600' : 'text-honey-500'}`}>
                  {rarityMeta.emoji} Image {rarityMeta.label.toLowerCase()} ! {rarityMeta.emoji}
                </p>
              )}
              <p className="text-lg font-display font-semibold text-success-500 mb-6">
                Elle rejoint ta collection !
              </p>
              <Button variant="primary" size="lg" className="px-8 rounded-full" onClick={handleClose}>
                Super !
              </Button>
            </>
          ) : (
            <p className="text-lg font-display font-semibold text-honey-600 mb-2">
              Tu as gagné une image mystère…<br />Touche la carte pour la découvrir !
            </p>
          )}
        </>
      ) : (
        <>
          <p className="text-lg font-display font-semibold text-success-500 mb-6">
            Quelle belle journée !
          </p>
          <Button variant="primary" size="lg" className="px-8 rounded-full" onClick={handleClose}>
            Super !
          </Button>
        </>
      )}
    </Overlay>
  )
}
