import { useState } from 'react'
import { ActiveRoutine, ActiveTimer, Child, RoutineTemplate, Screen } from '../types'
import ProgressBar from './ProgressBar'
import ChildAvatar from './ChildAvatar'
import { getRewardImagesForChildEntry } from '../data/rewardImages'
import { childTextColor, tint } from '../theme'
import { Badge, Button, Card, ScreenHeader } from './ui'

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-4">{children}</h2>
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
  const sanctionImages = sanctionChild
    ? (() => {
        const childIndex = children.findIndex(c => c.id === sanctionChild.id)
        const allImages = getRewardImagesForChildEntry(sanctionChild, childIndex)
        return allImages.filter(img => sanctionChild.unlockedImages.includes(img.id))
      })()
    : []

  const timerCount = (activeTimers ?? []).length

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <ScreenHeader className="mb-8" onBack={() => setCurrentScreen('home')} title="Espace parents" />

      {/* Routines en cours — grouped by template */}
      <Card className="p-6 mb-6">
        <SectionTitle>Routines en cours</SectionTitle>
        {hasActiveRoutine ? (
          <>
            {activeTemplateIds.map(templateId => {
              const template = routineTemplates.find(r => r.id === templateId)
              if (!template) return null
              const routinesForTemplate = activeRoutines.filter(ar => ar.templateId === templateId)
              return (
                <div key={templateId} className="mb-5 last:mb-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-display font-semibold text-ink">
                      {template.icon} {template.name}
                    </p>
                    <Button variant="honey-soft" size="md" onClick={() => resetRoutine(templateId)}>
                      Réinitialiser
                    </Button>
                  </div>
                  {children.map(child => {
                    const childRoutine = routinesForTemplate.find(ar => ar.childId === child.id)
                    if (!childRoutine) return null
                    const done = childRoutine.tasks.filter(t => t.done).length
                    const total = childRoutine.tasks.length
                    return (
                      <div key={child.id} className="flex items-center gap-4 mb-3">
                        <ChildAvatar photo={child.photo} color={child.color} size={40} />
                        <span className="font-semibold text-ink w-28">{child.name}</span>
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
              <Button variant="honey-soft" size="lg" className="w-full" onClick={handleNewDay}>
                ☀️ Nouvelle journée
              </Button>
            </div>
          </>
        ) : (
          <p className="text-ink-faint">Aucune routine en cours</p>
        )}
      </Card>

      {/* Gérer les routines + enfants + univers */}
      <Card className="p-6 mb-6">
        <SectionTitle>Gérer</SectionTitle>
        <div className="flex flex-col gap-3">
          <Button variant="success-soft" size="lg" className="w-full" onClick={() => setCurrentScreen('routine-list')}>
            📋 Modifier les routines
          </Button>
          <Button variant="soft" size="lg" className="w-full" onClick={() => setCurrentScreen('child-editor')}>
            👧 Gérer les enfants
          </Button>
          <Button variant="night-soft" size="lg" className="w-full" onClick={() => setCurrentScreen('universe-select')}>
            🌌 Univers des récompenses
          </Button>
        </div>
      </Card>

      {/* Minuteur */}
      <Card className="p-6 mb-6">
        <SectionTitle>Minuteur</SectionTitle>
        <Button
          variant="honey-soft"
          size="lg"
          className="w-full"
          onClick={() => {
            setTimerReturnScreen('parent')
            setTimerPrefill(null)
            setCurrentScreen('timer')
          }}
        >
          ⏳ Ouvrir le minuteur
          {timerCount > 0 && (
            <Badge tone="honey" className="ml-2">
              {timerCount} actif{timerCount > 1 ? 's' : ''}
            </Badge>
          )}
        </Button>
      </Card>

      {/* Sanctions */}
      <Card className="p-6 mb-6">
        <SectionTitle>Sanctions</SectionTitle>
        <p className="text-sm text-ink-faint mb-3">Retirer une image de la collection</p>

        {/* Child selection */}
        <div className="flex gap-3 mb-4 flex-wrap">
          {children.map(child => {
            const selected = sanctionChildId === child.id
            return (
              <button
                key={child.id}
                onClick={() => setSanctionChildId(child.id)}
                aria-pressed={selected}
                className={`min-h-12 flex items-center gap-2 px-4 py-2 rounded-full text-base font-display font-semibold border-2 transition-all active:scale-95 ${
                  selected ? '' : 'bg-warm-50 text-ink-soft border-line'
                }`}
                style={selected ? {
                  borderColor: child.color,
                  backgroundColor: tint(child.color, 0.12),
                  color: childTextColor(child.color),
                } : {}}
              >
                <ChildAvatar photo={child.photo} color={child.color} size={32} />
                {child.name}
              </button>
            )
          })}
        </div>

        {/* Images grid */}
        {sanctionChild && (
          sanctionImages.length > 0 ? (
            <div className="grid grid-cols-4 gap-2">
              {sanctionImages.map(img => (
                <button
                  key={img.id}
                  onClick={() => handleRemoveReward(sanctionChildId!, img.id)}
                  className="aspect-square rounded-xl overflow-hidden border-2 border-line hover:border-danger-300 active:scale-95 transition-all"
                >
                  <img src={img.src} alt={`Image de la collection de ${sanctionChild.name}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-ink-faint text-sm">Aucune image à retirer</p>
          )
        )}
      </Card>
    </div>
  )
}
