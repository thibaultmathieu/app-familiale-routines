import { useEffect, useState } from 'react'
import PinPad from './PinPad'
import { Overlay } from './ui'

interface PinSetupOverlayProps {
  onSave: (pin: string) => void
  onCancel: () => void
}

/** Définition du code parents : saisie puis confirmation (4 chiffres). */
export default function PinSetupOverlay({ onSave, onCancel }: PinSetupOverlayProps) {
  const [firstPin, setFirstPin] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    if (input.length !== 4) return
    const timer = setTimeout(() => {
      if (firstPin === null) {
        setFirstPin(input)
        setInput('')
      } else if (input === firstPin) {
        onSave(input)
      } else {
        setError(true)
        setFirstPin(null)
        setInput('')
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [input, firstPin, onSave])

  return (
    <Overlay onBackdropClick={onCancel} cardClassName="p-8 max-w-sm w-full">
      <h2 className="text-xl font-display font-semibold text-ink mb-1">Code parents</h2>
      <p className="text-sm text-ink-faint mb-4">
        {error
          ? 'Les codes ne correspondent pas, recommencez :'
          : firstPin === null
            ? 'Choisissez un code à 4 chiffres :'
            : 'Confirmez le code :'}
      </p>

      <PinPad
        value={input}
        error={error}
        onChange={v => {
          setInput(v)
          setError(false)
        }}
      />

      <button onClick={onCancel} className="w-full min-h-12 py-3 mt-4 text-ink-faint font-semibold active:scale-95 transition-transform">
        Annuler
      </button>
    </Overlay>
  )
}
