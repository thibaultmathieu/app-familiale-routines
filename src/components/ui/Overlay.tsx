import { ReactNode } from 'react'

interface OverlayProps {
  children: ReactNode
  /** Clic sur le fond (en dehors de la carte). */
  onBackdropClick?: () => void
  /** Pilotage d'un fondu externe (CelebrationOverlay, etc.). */
  visible?: boolean
  /** Classes de la carte centrale — remplace le défaut si fourni. */
  cardClassName?: string
  dim?: 'light' | 'medium' | 'strong'
}

const DIMS = {
  light: 'rgba(43, 38, 33, 0.30)',
  medium: 'rgba(43, 38, 33, 0.45)',
  strong: 'rgba(43, 38, 33, 0.60)',
}

export default function Overlay({
  children,
  onBackdropClick,
  visible = true,
  cardClassName = 'p-8 max-w-md w-full',
  dim = 'medium',
}: OverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-modal flex items-center justify-center p-4 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ backgroundColor: DIMS[dim] }}
      onClick={onBackdropClick}
    >
      <div
        className={`bg-white rounded-3xl shadow-overlay text-center ${cardClassName}`}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
