import { useEffect, useState } from 'react'
import PinPad from './PinPad'
import { Overlay } from './ui'

interface ParentGateProps {
  /** Code parents configuré — le gate n'est affiché que s'il existe. */
  pin: string
  onSuccess: () => void
  onCancel: () => void
}

/**
 * Saisie du code parents (4 chiffres). Sans code configuré, l'appui long
 * suffit et ce composant n'est jamais monté (cf. HomeScreen).
 */
export default function ParentGate({ pin, onSuccess, onCancel }: ParentGateProps) {
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  // Validation automatique au 4ᵉ chiffre — petit délai pour que le point s'affiche
  useEffect(() => {
    if (input.length !== pin.length) return
    if (input === pin) {
      onSuccess()
      return
    }
    const timer = setTimeout(() => {
      setError(true)
      setInput('')
    }, 250)
    return () => clearTimeout(timer)
  }, [input, pin, onSuccess])

  return (
    <Overlay onBackdropClick={onCancel} cardClassName="p-8 max-w-sm w-full">
      <h2 className="text-xl font-display font-semibold text-ink mb-1">Espace parents</h2>
      <p className="text-sm text-ink-faint mb-4">
        {error ? 'Code incorrect, réessayez :' : 'Saisissez votre code :'}
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
