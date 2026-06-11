import { useState } from 'react'

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
    if (input.length < 3) {
      setInput(input + d)
      setError(false)
    }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl p-8 text-center shadow-xl w-full max-w-sm mx-4"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-800 mb-1">Espace parents</h2>
        <p className="text-sm text-gray-500 mb-4">
          {error ? 'Mauvaise réponse, nouvelle question :' : 'Réponds pour entrer :'}
        </p>

        <p className="text-3xl font-bold text-gray-800 mb-3" aria-live="polite">
          {challenge.a} × {challenge.b} = ?
        </p>

        <div
          className={`h-14 mb-4 rounded-xl border-2 flex items-center justify-center text-2xl font-bold tracking-widest ${
            error ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-200 bg-gray-50 text-gray-800'
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
                  className="h-14 rounded-xl bg-gray-100 text-gray-500 text-xl font-bold active:scale-95 transition-transform"
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
                  className="h-14 rounded-xl bg-green-500 text-white text-xl font-bold active:scale-95 transition-transform"
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
                className="h-14 rounded-xl bg-gray-100 text-gray-800 text-xl font-bold active:scale-95 transition-transform"
              >
                {key}
              </button>
            )
          })}
        </div>

        <button onClick={onCancel} className="w-full py-3 text-gray-400 font-medium">
          Annuler
        </button>
      </div>
    </div>
  )
}
