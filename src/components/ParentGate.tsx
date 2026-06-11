import { useState } from 'react'
import { Overlay } from './ui'

interface ParentGateProps {
  onSuccess: () => void
  onCancel: () => void
}

// Multiplication volontairement hors des tables (12-19 × 4-9) : triviale pour un
// parent, hors de portée d'un enfant de 6-8 ans — pas de PIN à retenir.
function makeChallenge() {
  const a = 12 + Math.floor(Math.random() * 8)
  const b = 4 + Math.floor(Math.random() * 6)
  return { a, b, answer: a * b }
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'erase', '0', 'ok'] as const

export default function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
  const [challenge, setChallenge] = useState(makeChallenge)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  const pressDigit = (d: string) => {
    // Updater fonctionnel : robuste aux appuis très rapprochés (batching React)
    setInput(prev => (prev.length < 3 ? prev + d : prev))
    setError(false)
  }

  const erase = () => setInput(prev => prev.slice(0, -1))

  const validate = () => {
    if (input !== '' && parseInt(input, 10) === challenge.answer) {
      onSuccess()
    } else {
      setError(true)
      setInput('')
      setChallenge(makeChallenge())
    }
  }

  return (
    <Overlay onBackdropClick={onCancel} cardClassName="p-8 max-w-sm w-full">
      <h2 className="text-xl font-display font-semibold text-ink mb-1">Espace parents</h2>
      <p className="text-sm text-ink-faint mb-4">
        {error ? 'Mauvaise réponse, nouvelle question :' : 'Réponds pour entrer :'}
      </p>

      <p className="text-3xl font-display font-bold text-ink mb-3" aria-live="polite">
        {challenge.a} × {challenge.b} = ?
      </p>

      <div
        className={`h-14 mb-4 rounded-xl border-2 flex items-center justify-center text-2xl font-bold tracking-widest tabular-nums ${
          error ? 'border-danger-300 bg-danger-50 text-danger-500' : 'border-line bg-warm-50 text-ink'
        }`}
        aria-label="Réponse saisie"
      >
        {input || '···'}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {KEYS.map(key => {
          if (key === 'erase') {
            return (
              <button
                key={key}
                onClick={erase}
                className="h-14 rounded-xl bg-warm-100 text-ink-soft text-xl font-bold active:scale-95 transition-transform"
                aria-label="Effacer"
              >
                ⌫
              </button>
            )
          }
          if (key === 'ok') {
            return (
              <button
                key={key}
                onClick={validate}
                className="h-14 rounded-xl bg-success-500 text-white text-xl font-display font-bold active:scale-95 transition-transform"
                aria-label="Valider"
              >
                OK
              </button>
            )
          }
          return (
            <button
              key={key}
              onClick={() => pressDigit(key)}
              className="h-14 rounded-xl bg-warm-100 text-ink text-xl font-bold tabular-nums active:scale-95 transition-transform"
            >
              {key}
            </button>
          )
        })}
      </div>

      <button onClick={onCancel} className="w-full min-h-12 py-3 text-ink-faint font-semibold active:scale-95 transition-transform">
        Annuler
      </button>
    </Overlay>
  )
}
