import { useState } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RoutineTemplate, Screen } from '../types'
import ProgressBar from './ProgressBar'
import { getRewardImagesForChild } from '../data/rewardImages'

interface ParentPanelProps {
  children: Child[]
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  activeTimers: ActiveTimer[]
  setCurrentScreen: (screen: Screen) => void
  resetRoutine: (templateId: string) => void
  resetAllRoutines: () => void
  removeReward: (childId: string, imageId: string) => void
  setTimerReturnScreen: (screen: Screen | null) => void
  setTimerPrefill: (prefill: { label?: string; childIds?: string[] } | null) => void
}

export default function ParentPanel({
  children,
  routineTemplates,
  activeRoutines,
  activeTimers,
  setCurrentScreen,
  resetRoutine,
  resetAllRoutines,
  removeReward,
  setTimerReturnScreen,
  setTimerPrefill,
}: ParentPanelProps) {
  const [sanctionChildId, setSanctionChildId] = useState<string | null>(null)

  const hasActiveRoutine = activeRoutines.length > 0
  const activeTemplateIds = [...new Set(activeRoutines.map(ar => ar.templateId))]

  const handleNewDay = () => {
    if (window.confirm('Réinitialiser toutes les routines ? (Nouvelle journée)')) {
      resetAllRoutines()
    }
  }

  const handleRemoveReward = (childId: string, imageId: string) => {
    if (window.confirm('Retirer cette image comme sanction ?')) {
      removeReward(childId, imageId)
    }
  }

  const sanctionChild = sanctionChildId ? children.find(c => c.id === sanctionChildId) : null
  const sanctionImages = sanctionChildId
    ? (() => {
        const allImages = getRewardImagesForChild(sanctionChildId)
        const child = children.find(c => c.id === sanctionChildId)
        if (!child) return []
        return allImages.filter(img => child.unlockedImages.includes(img.id))
      })()
    : []

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentScreen('home')}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Espace Parent</h1>
        <div className="w-24" />
      </div>

      {/* Routines en cours — grouped by template */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">ROUTINES EN COURS</h2>
        {hasActiveRoutine ? (
          <>
            {activeTemplateIds.map(templateId => {
              const template = routineTemplates.find(r => r.id === templateId)
              if (!template) return null
              const routinesForTemplate = activeRoutines.filter(ar => ar.templateId === templateId)
              return (
                <div key={templateId} className="mb-5 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold text-gray-800">
                      {template.icon} {template.name}
                    </p>
                    <button
                      onClick={() => resetRoutine(templateId)}
                      className="text-sm text-orange-500 font-medium px-3 py-1 rounded-lg bg-orange-50 active:scale-95 transition-transform"
                    >
                      Réinitialiser
                    </button>
                  </div>
                  {children.map(child => {
                    const childRoutine = routinesForTemplate.find(ar => ar.childId === child.id)
                    if (!childRoutine) return null
                    const done = childRoutine.tasks.filter(t => t.done).length
                    const total = childRoutine.tasks.length
                    return (
                      <div key={child.id} className="flex items-center gap-4 mb-3">
                        <img src={child.photo} alt={child.name} className="w-10 h-10 rounded-full object-cover" />
                        <span className="font-medium text-gray-700 w-28">{child.name}</span>
                        <div className="flex-1">
                          <ProgressBar done={done} total={total} color={child.color} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <div className="mt-4">
              <button
                onClick={handleNewDay}
                className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-medium active:scale-95 transition-transform"
              >
                Nouvelle journée
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-400">Aucune routine en cours</p>
        )}
      </div>

      {/* Minuteur */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">MINUTEUR</h2>
        <button
          onClick={() => {
            setTimerReturnScreen('parent')
            setTimerPrefill(null)
            setCurrentScreen('timer')
          }}
          className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-medium active:scale-95 transition-transform"
        >
          ⏳ Ouvrir le minuteur
          {(activeTimers ?? []).length > 0 && (
            <span className="ml-2 bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {(activeTimers ?? []).length} actif{(activeTimers ?? []).length > 1 ? 's' : ''}
            </span>
          )}
        </button>
      </div>

      {/* Sanctions */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-500 mb-4">SANCTIONS</h2>
        <p className="text-sm text-gray-400 mb-3">Retirer une image de la collection</p>

        {/* Child selection */}
        <div className="flex gap-3 mb-4">
          {children.map(child => (
            <button
              key={child.id}
              onClick={() => setSanctionChildId(child.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                sanctionChildId === child.id
                  ? 'border-2 text-gray-700'
                  : 'bg-gray-50 text-gray-500 border-2 border-gray-100'
              }`}
              style={sanctionChildId === child.id ? { borderColor: child.color, backgroundColor: child.color + '20' } : {}}
            >
              <img src={child.photo} alt={child.name} className="w-8 h-8 rounded-full object-cover" />
              {child.name}
            </button>
          ))}
        </div>

        {/* Images grid */}
        {sanctionChild && (
          sanctionImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {sanctionImages.map(img => (
                <button
                  key={img.id}
                  onClick={() => handleRemoveReward(sanctionChildId!, img.id)}
                  className="aspect-square rounded-lg overflow-hidden border-2 border-gray-100 hover:border-red-300 active:scale-95 transition-all"
                >
                  <img src={img.src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Aucune image à retirer</p>
          )
        )}
      </div>
    </div>
  )
}
