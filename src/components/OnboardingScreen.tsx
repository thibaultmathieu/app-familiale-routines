import { useState, useEffect, useRef } from 'react'
import { RoutineTemplate, TaskTemplate } from '../types'
import ChildAvatar, { DEFAULT_AVATAR_PATH } from './ChildAvatar'
import DayOfWeekPicker from './DayOfWeekPicker'
import EmojiPicker from './EmojiPicker'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { ACTIVE_UNIVERSES } from '../data/universes'
import { getRewardImagesForUniverse } from '../data/rewardImages'
import { childTextColor, COLOR_PALETTE, tint } from '../theme'
import AppLogo from './AppLogo'
import { Button, Card, FieldLabel, IconButton, TextInput } from './ui'

const DRAFT_CHILDREN_KEY = 'routines-onboarding-draft'
const DRAFT_STEP_KEY = 'routines-onboarding-step'

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

interface LocalChild {
  id: string
  name: string
  color: string
  photo: string
  universeId?: string
}

interface OnboardingScreenProps {
  routineTemplates: RoutineTemplate[]
  addChild: (child: { id: string; name: string; photo: string; color: string; universeId?: string; unlockedUniverseIds?: string[] }) => void
  updateRoutine: (id: string, updates: Partial<RoutineTemplate>) => void
  addRoutine: (template: Omit<RoutineTemplate, 'id'>) => string
  completeOnboarding: () => void
}

type Step = 'welcome' | 'children' | 'universes' | 'routines' | 'routine-detail'

export default function OnboardingScreen({
  routineTemplates,
  addChild,
  updateRoutine,
  addRoutine,
  completeOnboarding,
}: OnboardingScreenProps) {
  // Brouillon persisté : un reload en plein onboarding ne perd ni les enfants saisis ni l'étape
  const [step, setStep] = useLocalStorage<Step>(DRAFT_STEP_KEY, 'welcome')
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [localChildren, setLocalChildren] = useLocalStorage<LocalChild[]>(DRAFT_CHILDREN_KEY, [
    { id: `child-${Date.now()}`, name: '', color: COLOR_PALETTE[0], photo: DEFAULT_AVATAR_PATH },
  ])

  const canProceed = localChildren.some(c => c.name.trim().length > 0)

  // Un reload pendant l'édition d'une routine (id non persisté) retombe sur la liste
  useEffect(() => {
    if (step === 'routine-detail' && !editingRoutineId) setStep('routines')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Children step handlers ---

  const addLocalChild = () => {
    setLocalChildren(prev => [
      ...prev,
      {
        id: `child-${Date.now()}`,
        name: '',
        color: COLOR_PALETTE[prev.length % COLOR_PALETTE.length],
        photo: DEFAULT_AVATAR_PATH,
      },
    ])
  }

  const updateLocalChild = (id: string, updates: Partial<LocalChild>) => {
    setLocalChildren(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const removeLocalChild = (id: string) => {
    setLocalChildren(prev => prev.filter(c => c.id !== id))
  }

  const handlePhotoUpload = (childId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onerror = () => console.error('FileReader error:', reader.error)
    reader.onload = () => {
      if (typeof reader.result !== 'string') return
      const img = new Image()
      img.onload = () => {
        const MAX = 200
        let w = img.width
        let h = img.height
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) return
        ctx.drawImage(img, 0, 0, w, h)
        updateLocalChild(childId, { photo: canvas.toDataURL('image/jpeg', 0.8) })
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // --- Completion ---

  const handleComplete = () => {
    localChildren
      .filter(c => c.name.trim())
      .forEach(c => addChild({
        id: c.id,
        name: c.name.trim(),
        photo: c.photo,
        color: c.color,
        universeId: c.universeId,
        unlockedUniverseIds: c.universeId ? [c.universeId] : undefined,
      }))
    localStorage.removeItem(DRAFT_CHILDREN_KEY)
    localStorage.removeItem(DRAFT_STEP_KEY)
    completeOnboarding()
  }

  // --- Step indicator ---

  const StepDots = () => {
    const steps: Step[] = ['children', 'universes', 'routines']
    const activeIndex = step === 'routine-detail' ? 2 : steps.indexOf(step)
    return (
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className={`w-3 h-3 rounded-full transition-colors ${i <= activeIndex ? 'bg-honey-400' : 'bg-warm-200'}`} />
        ))}
      </div>
    )
  }

  // --- Welcome step ---

  if (step === 'welcome') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 max-w-xl mx-auto text-center overflow-y-auto">
        <AppLogo size={110} className="mb-5 drop-shadow-sm" />
        <h1 className="text-3xl font-display font-semibold text-ink mb-3">
          Bienvenue dans Routines Familiales
        </h1>
        <p className="text-lg text-ink-soft mb-8 max-w-md">
          Des routines que vos enfants ont envie de cocher,
          des images à collectionner en récompense — et vous gardez la main.
        </p>

        <div className="w-full max-w-md space-y-3 mb-8 text-left">
          <Card className="p-4 flex items-center gap-4">
            <span className="text-3xl" aria-hidden="true">👧</span>
            <p className="text-ink-soft text-sm"><span className="font-semibold text-ink">Créez le profil de vos enfants</span> — prénom, photo, couleur préférée</p>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <span className="text-3xl" aria-hidden="true">✅</span>
            <p className="text-ink-soft text-sm"><span className="font-semibold text-ink">Ajustez vos routines</span> — matin, retour d'école, soir… ou les vôtres</p>
          </Card>
          <Card className="p-4 flex items-center gap-4">
            <span className="text-3xl" aria-hidden="true">🎁</span>
            <p className="text-ink-soft text-sm"><span className="font-semibold text-ink">C'est prêt !</span> — chaque routine terminée fait gagner une image à collectionner</p>
          </Card>
        </div>

        <Button variant="primary" size="xl" className="w-full max-w-md" onClick={() => setStep('children')}>
          Commencer
        </Button>
        <p className="text-sm text-ink-faint mt-3">⏱️ Prêt en 2 minutes</p>
        <div className="h-6 shrink-0" />
      </div>
    )
  }

  // --- Routine detail sub-step ---

  if (step === 'routine-detail' && editingRoutineId) {
    return (
      <RoutineDetailStep
        routineTemplates={routineTemplates}
        editingRoutineId={editingRoutineId}
        updateRoutine={updateRoutine}
        onBack={() => { setEditingRoutineId(null); setStep('routines') }}
      />
    )
  }

  // --- Universes step ---

  if (step === 'universes') {
    const namedChildren = localChildren.filter(c => c.name.trim())
    const allChosen = namedChildren.every(c => c.universeId)
    return (
      <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
        <StepDots />

        <button
          onClick={() => setStep('children')}
          className="min-h-12 px-4 py-2 -ml-4 rounded-2xl text-ink-faint text-base font-display font-medium self-start mb-2 active:scale-95 transition-transform"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-display font-semibold text-ink mb-2">L'univers de chaque enfant</h1>
        <p className="text-ink-faint text-sm mb-1">
          Chaque routine terminée fait gagner une image de l'univers choisi.
        </p>
        <p className="text-ink-faint text-sm mb-6">
          💡 Choisissez ensemble : c'est sa collection ! Il en débloquera de nouveaux en réussissant ses routines.
        </p>

        <div className="space-y-6 flex-1">
          {namedChildren.map(child => (
            <div key={child.id}>
              <h2 className="text-lg font-display font-bold mb-3" style={{ color: childTextColor(child.color) }}>
                {child.name}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {ACTIVE_UNIVERSES.map(universe => {
                  const thumbnail = getRewardImagesForUniverse(universe.id)[0]?.src
                  const selected = child.universeId === universe.id
                  return (
                    <button
                      key={universe.id}
                      onClick={() => updateLocalChild(child.id, { universeId: universe.id })}
                      aria-pressed={selected}
                      className={`relative rounded-2xl border-2 overflow-hidden bg-white shadow-card text-center active:scale-95 transition-all ${
                        selected ? '' : 'border-line hover:border-line-strong'
                      }`}
                      style={selected ? { borderColor: child.color, backgroundColor: tint(child.color, 0.08) } : undefined}
                    >
                      {selected && (
                        <span
                          className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-sm flex items-center justify-center z-10"
                          style={{ backgroundColor: childTextColor(child.color) }}
                          role="img"
                          aria-label="Univers choisi"
                        >
                          ✓
                        </span>
                      )}
                      {thumbnail && (
                        <img src={thumbnail} alt="" aria-hidden="true" className="w-full aspect-square object-cover" />
                      )}
                      <div className="p-2">
                        <span className="block text-xl" aria-hidden="true">{universe.emoji}</span>
                        <span className="font-display font-semibold text-ink text-xs leading-tight">{universe.name}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <Button variant="primary" size="xl" className="mt-6" disabled={!allChosen} onClick={() => setStep('routines')}>
          Suivant
        </Button>
        <div className="h-6 shrink-0" />
      </div>
    )
  }

  // --- Routines step ---

  if (step === 'routines') {
    return (
      <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
        <StepDots />

        <button
          onClick={() => setStep('universes')}
          className="min-h-12 px-4 py-2 -ml-4 rounded-2xl text-ink-faint text-base font-display font-medium self-start mb-2 active:scale-95 transition-transform"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-display font-semibold text-ink mb-2">Vos routines</h1>
        <p className="text-ink-faint text-sm mb-6">
          Nous avons préparé 3 routines. Modifiez-les ou ajoutez les vôtres.
        </p>

        <div className="space-y-3 mb-6 flex-1">
          {routineTemplates.map(routine => {
            const days = routine.scheduledDays ?? []
            return (
              <Card
                key={routine.id}
                onClick={() => { setEditingRoutineId(routine.id); setStep('routine-detail') }}
                className="w-full p-5 flex items-center gap-4"
              >
                <span className="text-3xl" aria-hidden="true">{routine.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-display font-semibold text-ink truncate block">{routine.name}</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 0].map(d => (
                        <span
                          key={d}
                          className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            days.includes(d) ? 'bg-ink text-warm-50' : 'bg-warm-100 text-ink-faint/60'
                          }`}
                        >
                          {DAY_LABELS[d]}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-ink-faint">
                      {routine.tasks.length} tâche{routine.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <span className="text-ink-faint/60 text-xl" aria-hidden="true">›</span>
              </Card>
            )
          })}

          <Button
            variant="outline"
            size="xl"
            onClick={() => {
              const id = addRoutine({ name: 'Nouvelle routine', icon: '📋', scheduledDays: [], tasks: [] })
              setEditingRoutineId(id)
              setStep('routine-detail')
            }}
          >
            + Ajouter une routine
          </Button>
        </div>

        <Button variant="primary" size="xl" onClick={handleComplete}>
          C'est parti !
        </Button>
        <div className="h-6 shrink-0" />
      </div>
    )
  }

  // --- Children step (default) ---

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <StepDots />

      <h1 className="text-2xl font-display font-semibold text-ink mb-2">Qui sont vos enfants ?</h1>
      <p className="text-ink-faint text-sm mb-6">Ajoutez au moins un enfant pour commencer</p>

      <div className="space-y-4 flex-1">
        {localChildren.map((child, index) => (
          <ChildCard
            key={child.id}
            child={child}
            index={index}
            totalChildren={localChildren.length}
            onUpdate={updateLocalChild}
            onRemove={removeLocalChild}
            onPhotoUpload={handlePhotoUpload}
          />
        ))}

        <Button variant="outline" size="xl" onClick={addLocalChild}>
          + Ajouter un enfant
        </Button>
      </div>

      <Button variant="primary" size="xl" className="mt-6" disabled={!canProceed} onClick={() => setStep('universes')}>
        Suivant
      </Button>
      <div className="h-6 shrink-0" />
    </div>
  )
}

// --- Child card sub-component ---

function ChildCard({
  child,
  index,
  totalChildren,
  onUpdate,
  onRemove,
  onPhotoUpload,
}: {
  child: LocalChild
  index: number
  totalChildren: number
  onUpdate: (id: string, updates: Partial<LocalChild>) => void
  onRemove: (id: string) => void
  onPhotoUpload: (childId: string, e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (index === 0 && !child.name) {
      nameRef.current?.focus()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card className="p-5 space-y-4">
      {/* Remove button */}
      {totalChildren > 1 && (
        <div className="flex justify-end -mt-2 -mr-2">
          <IconButton size={44} ariaLabel="Retirer cet enfant" onClick={() => onRemove(child.id)} className="text-ink-faint hover:text-danger-400 hover:bg-danger-50 text-lg">
            ✕
          </IconButton>
        </div>
      )}

      {/* Avatar + Photo */}
      <div className="flex items-center gap-4">
        <div className="border-[3px] rounded-full" style={{ borderColor: child.color }}>
          <ChildAvatar photo={child.photo} color={child.color} size={64} />
        </div>
        <div className="flex-1">
          <label className="min-h-12 px-4 py-2 bg-warm-100 text-ink-soft rounded-xl text-sm font-semibold inline-flex items-center active:scale-95 transition-transform hover:bg-warm-200 cursor-pointer">
            📷 Ajouter une photo
            <input
              type="file"
              accept="image/*,.heic,.heif"
              className="hidden"
              onChange={e => onPhotoUpload(child.id, e)}
            />
          </label>
          <p className="text-xs text-ink-faint mt-1.5">
            Fortement recommandée : la photo est le repère visuel de votre enfant dans l'app.
          </p>
        </div>
      </div>

      {/* Name */}
      <TextInput
        inputRef={nameRef}
        value={child.name}
        onChange={v => onUpdate(child.id, { name: v })}
        placeholder="Prénom de l'enfant"
      />

      {/* Color picker */}
      <p className="text-xs text-ink-faint -mb-1">
        💡 Sa couleur : demandez-lui de la choisir, il s'y retrouvera d'autant mieux !
      </p>
      <div className="flex gap-2 flex-wrap">
        {COLOR_PALETTE.map(color => (
          <button
            key={color}
            onClick={() => onUpdate(child.id, { color })}
            aria-label={`Couleur ${color}`}
            aria-pressed={child.color === color}
            className={`w-12 h-12 rounded-full transition-all active:scale-90 ${
              child.color === color ? 'ring-[3px] ring-offset-2 ring-ink-faint scale-110' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </Card>
  )
}

// --- Routine detail sub-component ---

function RoutineDetailStep({
  routineTemplates,
  editingRoutineId,
  updateRoutine,
  onBack,
}: {
  routineTemplates: RoutineTemplate[]
  editingRoutineId: string
  updateRoutine: (id: string, updates: Partial<RoutineTemplate>) => void
  onBack: () => void
}) {
  const routine = routineTemplates.find(r => r.id === editingRoutineId)

  const [name, setName] = useState('')
  const [icon, setIcon] = useState('📋')
  const [days, setDays] = useState<number[]>([])
  const [tasks, setTasks] = useState<TaskTemplate[]>([])
  const [showIconPicker, setShowIconPicker] = useState(false)
  const [taskEmojiIndex, setTaskEmojiIndex] = useState<number | null>(null)

  useEffect(() => {
    if (routine) {
      setName(routine.name)
      setIcon(routine.icon)
      setDays(routine.scheduledDays ?? [])
      setTasks(routine.tasks.map(t => ({ ...t })))
    }
  }, [routine])

  if (!routine) return null

  const handleSave = () => {
    updateRoutine(editingRoutineId, {
      name: name.trim() || 'Sans nom',
      icon,
      scheduledDays: days,
      tasks,
    })
    onBack()
  }

  const addTask = () => {
    setTasks([...tasks, { id: `t-${Date.now()}`, label: '', icon: '📋' }])
  }

  const updateTask = (index: number, updates: Partial<TaskTemplate>) => {
    setTasks(tasks.map((t, i) => i === index ? { ...t, ...updates } : t))
  }

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index))
  }

  const moveTask = (index: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= tasks.length) return
    const updated = [...tasks]
    ;[updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]]
    setTasks(updated)
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="min-h-12 px-4 py-2 -ml-4 rounded-2xl text-ink-faint text-lg font-display font-medium active:scale-95 transition-transform"
        >
          ← Retour
        </button>
        <div className="w-24" />
      </div>

      <div>
        {/* Name */}
        <FieldLabel>Nom</FieldLabel>
        <TextInput value={name} onChange={setName} placeholder="Nom de la routine" className="mb-5" />

        {/* Icon */}
        <FieldLabel>Icône</FieldLabel>
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          aria-label="Changer l'icône de la routine"
          className="text-4xl mb-2 w-14 h-14 flex items-center justify-center rounded-xl bg-warm-50 border-2 border-line hover:bg-warm-100 transition-colors active:scale-95"
        >
          {icon}
        </button>
        {showIconPicker && (
          <div className="mb-5 p-3 bg-warm-50 border border-line rounded-2xl">
            <EmojiPicker value={icon} onChange={e => { setIcon(e); setShowIconPicker(false) }} />
          </div>
        )}

        {/* Days */}
        <FieldLabel className="mt-3" hint="(aucun = à la demande)">Jours planifiés</FieldLabel>
        <div className="mb-5">
          <DayOfWeekPicker value={days} onChange={setDays} />
        </div>

        {/* Tasks */}
        <FieldLabel className="mb-3">Tâches</FieldLabel>
        <div className="space-y-2 mb-4">
          {tasks.map((task, i) => (
            <div key={task.id} className="flex items-center gap-1.5 bg-white rounded-xl p-2.5 border-2 border-line">
              <button
                type="button"
                onClick={() => setTaskEmojiIndex(taskEmojiIndex === i ? null : i)}
                aria-label="Changer l'icône de la tâche"
                className="text-xl w-11 h-11 flex items-center justify-center rounded-lg hover:bg-warm-100 active:scale-90 transition-transform shrink-0"
              >
                {task.icon}
              </button>
              <TextInput
                variant="bare"
                value={task.label}
                onChange={v => updateTask(i, { label: v })}
                placeholder="Nom de la tâche"
              />
              <IconButton size={44} ariaLabel="Monter la tâche" disabled={i === 0} onClick={() => moveTask(i, 'up')} className="text-ink-faint hover:bg-warm-100">
                ↑
              </IconButton>
              <IconButton size={44} ariaLabel="Descendre la tâche" disabled={i === tasks.length - 1} onClick={() => moveTask(i, 'down')} className="text-ink-faint hover:bg-warm-100">
                ↓
              </IconButton>
              <IconButton size={44} ariaLabel="Supprimer la tâche" onClick={() => removeTask(i)} className="text-ink-faint hover:text-danger-400 hover:bg-danger-50">
                ✕
              </IconButton>
            </div>
          ))}

          {taskEmojiIndex !== null && (
            <div className="p-3 bg-warm-50 border border-line rounded-2xl">
              <EmojiPicker
                value={tasks[taskEmojiIndex]?.icon ?? '📋'}
                onChange={e => {
                  updateTask(taskEmojiIndex, { icon: e })
                  setTaskEmojiIndex(null)
                }}
              />
            </div>
          )}
        </div>

        <Button variant="soft" size="md" onClick={addTask} className="mb-6">
          + Ajouter une tâche
        </Button>
      </div>

      <div className="mt-auto">
        <Button variant="primary" size="xl" onClick={handleSave}>
          Enregistrer
        </Button>
      </div>
      <div className="h-6 shrink-0" />
    </div>
  )
}
