import { useState, useRef, useCallback } from 'react'
import { ActiveRoutine, Child, RoutineTemplate, Screen } from '../types'
import ProgressBar from './ProgressBar'

interface HomeScreenProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  setCurrentScreen: (screen: Screen) => void
  launchRoutine: (templateId: string, childIds: string[]) => void
  addCustomRoutine: (name: string, tasks: { label: string; icon: string }[]) => string
}

export default function HomeScreen({
  children,
  routineTemplates,
  activeRoutines,
  setCurrentScreen,
  launchRoutine,
  addCustomRoutine,
}: HomeScreenProps) {
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customTasks, setCustomTasks] = useState<string[]>([''])
  const [customTarget, setCustomTarget] = useState<'both' | 'evangelina' | 'noah'>('both')

  // Appui long pour accéder à l'espace parent
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleGearDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setCurrentScreen('parent')
    }, 2000)
  }, [setCurrentScreen])
  const handleGearUp = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }, [])

  const fixedRoutines = routineTemplates.filter(r => r.type === 'fixed')
  const hasActiveRoutine = activeRoutines.length > 0

  const handleLaunchFixed = (templateId: string) => {
    const childIds = children.map(c => c.id)
    launchRoutine(templateId, childIds)
  }

  const handleLaunchCustom = () => {
    const validTasks = customTasks.filter(t => t.trim())
    if (!customName.trim() || validTasks.length === 0) return

    const templateId = addCustomRoutine(
      customName.trim(),
      validTasks.map(t => ({ label: t.trim(), icon: '📋' }))
    )

    const childIds = customTarget === 'both'
      ? children.map(c => c.id)
      : [customTarget]

    launchRoutine(templateId, childIds)
    setShowCustomForm(false)
    setCustomName('')
    setCustomTasks([''])
  }

  return (
    <div className="h-full flex flex-col p-6">
      {/* Titre */}
      <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
        Routines Familiales
      </h1>

      {/* Boutons de lancement rapide */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-3xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4 w-full">
          {fixedRoutines.map(routine => (
            <button
              key={routine.id}
              onClick={() => handleLaunchFixed(routine.id)}
              className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100
                         active:scale-95 transition-transform flex flex-col items-center gap-3
                         hover:border-gray-200"
            >
              <span className="text-5xl">{routine.icon}</span>
              <span className="text-xl font-semibold text-gray-700">{routine.name}</span>
            </button>
          ))}
        </div>

        {/* Bouton routine personnalisée */}
        {!showCustomForm ? (
          <button
            onClick={() => setShowCustomForm(true)}
            className="bg-white rounded-2xl px-8 py-4 shadow-sm border-2 border-dashed border-gray-300
                       active:scale-95 transition-transform text-gray-500 text-lg font-medium
                       hover:border-gray-400 w-full max-w-md"
          >
            ➕ Routine personnalisée
          </button>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 w-full">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Nouvelle routine</h3>
            <input
              type="text"
              placeholder="Nom de la routine"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-3 focus:outline-none focus:border-blue-300"
            />
            {customTasks.map((task, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder={`Tâche ${i + 1}`}
                  value={task}
                  onChange={e => {
                    const updated = [...customTasks]
                    updated[i] = e.target.value
                    setCustomTasks(updated)
                  }}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 text-lg focus:outline-none focus:border-blue-300"
                />
                {customTasks.length > 1 && (
                  <button
                    onClick={() => setCustomTasks(customTasks.filter((_, j) => j !== i))}
                    className="text-gray-400 px-2 text-xl"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={() => setCustomTasks([...customTasks, ''])}
              className="text-blue-500 text-sm font-medium mb-4"
            >
              + Ajouter une tâche
            </button>

            {/* Sélection de la cible */}
            <div className="flex gap-2 mb-4">
              {(['both', 'evangelina', 'noah'] as const).map(target => (
                <button
                  key={target}
                  onClick={() => setCustomTarget(target)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    customTarget === target
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {target === 'both' ? 'Les deux' : target === 'evangelina' ? 'Evangéline' : 'Noah'}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLaunchCustom}
                className="flex-1 bg-green-400 text-white rounded-xl py-3 text-lg font-medium active:scale-95 transition-transform"
              >
                Lancer
              </button>
              <button
                onClick={() => { setShowCustomForm(false); setCustomName(''); setCustomTasks(['']) }}
                className="px-6 bg-gray-100 text-gray-500 rounded-xl py-3 text-lg font-medium"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Résumé routine en cours */}
      {hasActiveRoutine && (
        <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm border-2 border-gray-100 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-500">EN COURS</span>
            <button
              onClick={() => setCurrentScreen('routine')}
              className="text-blue-500 text-sm font-medium"
            >
              Voir la routine →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {children.map(child => {
              const childRoutine = activeRoutines.find(ar => ar.childId === child.id)
              if (!childRoutine) return null
              const done = childRoutine.tasks.filter(t => t.done).length
              const total = childRoutine.tasks.length
              return (
                <div key={child.id} className="flex items-center gap-3">
                  <img src={child.photo} alt={child.name} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-sm font-medium text-gray-700">{child.name}</span>
                  <div className="flex-1">
                    <ProgressBar done={done} total={total} color={child.color} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Bouton ⚙️ — appui long */}
      <button
        onMouseDown={handleGearDown}
        onMouseUp={handleGearUp}
        onMouseLeave={handleGearUp}
        onTouchStart={handleGearDown}
        onTouchEnd={handleGearUp}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 text-xl"
        aria-label="Espace parent"
      >
        ⚙️
      </button>
    </div>
  )
}
