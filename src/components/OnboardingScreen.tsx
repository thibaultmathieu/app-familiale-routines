import { useState, useEffect, useRef } from 'react'
import { RoutineTemplate, TaskTemplate } from '../types'
import ChildAvatar, { DEFAULT_AVATAR_PATH } from './ChildAvatar'
import DayOfWeekPicker from './DayOfWeekPicker'
import EmojiPicker from './EmojiPicker'

const COLOR_PALETTE = [
  '#A78BFA', '#60A5FA', '#F472B6', '#34D399',
  '#FBBF24', '#FB923C', '#F87171', '#A3E635',
]

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

interface LocalChild {
  id: string
  name: string
  color: string
  photo: string
}

interface OnboardingScreenProps {
  routineTemplates: RoutineTemplate[]
  addChild: (child: { id: string; name: string; photo: string; color: string }) => void
  updateRoutine: (id: string, updates: Partial<RoutineTemplate>) => void
  addRoutine: (template: Omit<RoutineTemplate, 'id'>) => string
  completeOnboarding: () => void
}

type Step = 'children' | 'routines' | 'routine-detail'

export default function OnboardingScreen({
  routineTemplates,
  addChild,
  updateRoutine,
  addRoutine,
  completeOnboarding,
}: OnboardingScreenProps) {
  const [step, setStep] = useState<Step>('children')
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null)
  const [localChildren, setLocalChildren] = useState<LocalChild[]>([
    { id: `child-${Date.now()}`, name: '', color: COLOR_PALETTE[0], photo: DEFAULT_AVATAR_PATH },
  ])

  const canProceed = localChildren.some(c => c.name.trim().length > 0)

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
      .forEach(c => addChild({ id: c.id, name: c.name.trim(), photo: c.photo, color: c.color }))
    completeOnboarding()
  }

  // --- Step indicator ---

  const StepDots = () => (
    <div className="flex justify-center gap-2 mb-6">
      <div className={`w-3 h-3 rounded-full transition-colors ${step === 'children' ? 'bg-blue-500' : 'bg-gray-200'}`} />
      <div className={`w-3 h-3 rounded-full transition-colors ${step !== 'children' ? 'bg-blue-500' : 'bg-gray-200'}`} />
    </div>
  )

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

  // --- Routines step ---

  if (step === 'routines') {
    return (
      <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
        <StepDots />

        <button
          onClick={() => setStep('children')}
          className="text-gray-400 text-sm font-medium mb-4 self-start"
        >
          ← Retour
        </button>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">Vos routines</h1>
        <p className="text-gray-400 text-sm mb-6">
          Nous avons préparé 3 routines. Modifiez-les ou ajoutez les vôtres.
        </p>

        <div className="space-y-3 mb-6 flex-1">
          {routineTemplates.map(routine => {
            const days = routine.scheduledDays ?? []
            return (
              <button
                key={routine.id}
                onClick={() => { setEditingRoutineId(routine.id); setStep('routine-detail') }}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
              >
                <span className="text-3xl">{routine.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-gray-800 truncate block">{routine.name}</span>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 0].map(d => (
                        <span
                          key={d}
                          className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                            days.includes(d) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-300'
                          }`}
                        >
                          {DAY_LABELS[d]}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-gray-400">
                      {routine.tasks.length} tâche{routine.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <span className="text-gray-300 text-xl">›</span>
              </button>
            )
          })}

          <button
            onClick={() => {
              const id = addRoutine({ name: 'Nouvelle routine', icon: '📋', scheduledDays: [], tasks: [] })
              setEditingRoutineId(id)
              setStep('routine-detail')
            }}
            className="w-full bg-white rounded-2xl px-6 py-4 shadow-sm border-2 border-dashed border-gray-300 text-gray-500 text-lg font-medium active:scale-95 transition-transform"
          >
            + Ajouter une routine
          </button>
        </div>

        <button
          onClick={handleComplete}
          className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform"
        >
          C'est parti !
        </button>
        <div className="h-6" />
      </div>
    )
  }

  // --- Children step (default) ---

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <StepDots />

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Qui sont vos enfants ?</h1>
      <p className="text-gray-400 text-sm mb-6">Ajoutez au moins un enfant pour commencer</p>

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

        <button
          onClick={addLocalChild}
          className="w-full py-4 bg-white rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-lg font-medium active:scale-95 transition-transform hover:border-gray-400"
        >
          + Ajouter un enfant
        </button>
      </div>

      <button
        onClick={() => setStep('routines')}
        disabled={!canProceed}
        className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed mt-6"
      >
        Suivant
      </button>
      <div className="h-6" />
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
  }, [])

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 space-y-4">
      {/* Remove button */}
      {totalChildren > 1 && (
        <div className="flex justify-end -mt-2 -mr-2">
          <button
            onClick={() => onRemove(child.id)}
            className="text-gray-300 hover:text-red-400 text-lg px-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Avatar + Photo */}
      <div className="flex items-center gap-4">
        <div className="border-3 rounded-full" style={{ borderColor: child.color }}>
          <ChildAvatar photo={child.photo} color={child.color} size={64} />
        </div>
        <label className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:scale-95 transition-transform hover:bg-gray-200 cursor-pointer">
          📷 Photo
          <input
            type="file"
            accept="image/*,.heic,.heif"
            className="hidden"
            onChange={e => onPhotoUpload(child.id, e)}
          />
        </label>
      </div>

      {/* Name */}
      <input
        ref={nameRef}
        type="text"
        value={child.name}
        onChange={e => onUpdate(child.id, { name: e.target.value })}
        placeholder="Prénom de l'enfant"
        className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-300"
      />

      {/* Color picker */}
      <div className="flex gap-2">
        {COLOR_PALETTE.map(color => (
          <button
            key={color}
            onClick={() => onUpdate(child.id, { color })}
            className={`w-10 h-10 rounded-full transition-all ${
              child.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
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
        <button onClick={onBack} className="text-gray-400 text-lg font-medium px-4 py-2">
          ← Retour
        </button>
        <div className="w-24" />
      </div>

      <div>
        {/* Name */}
        <label className="block text-sm font-semibold text-gray-500 mb-2">Nom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-5 focus:outline-none focus:border-blue-300"
          placeholder="Nom de la routine"
        />

        {/* Icon */}
        <label className="block text-sm font-semibold text-gray-500 mb-2">Icône</label>
        <button
          type="button"
          onClick={() => setShowIconPicker(!showIconPicker)}
          className="text-4xl mb-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          {icon}
        </button>
        {showIconPicker && (
          <div className="mb-5 p-3 bg-gray-50 rounded-xl">
            <EmojiPicker value={icon} onChange={e => { setIcon(e); setShowIconPicker(false) }} />
          </div>
        )}

        {/* Days */}
        <label className="block text-sm font-semibold text-gray-500 mb-2 mt-3">
          Jours planifiés
          <span className="font-normal text-gray-400 ml-2">(aucun = à la demande)</span>
        </label>
        <div className="mb-5">
          <DayOfWeekPicker value={days} onChange={setDays} />
        </div>

        {/* Tasks */}
        <label className="block text-sm font-semibold text-gray-500 mb-3">Tâches</label>
        <div className="space-y-2 mb-4">
          {tasks.map((task, i) => (
            <div key={task.id} className="flex items-center gap-2 bg-white rounded-xl p-3 border-2 border-gray-100">
              <button
                type="button"
                onClick={() => setTaskEmojiIndex(taskEmojiIndex === i ? null : i)}
                className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                {task.icon}
              </button>
              <input
                type="text"
                value={task.label}
                onChange={e => updateTask(i, { label: e.target.value })}
                placeholder="Nom de la tâche"
                className="flex-1 min-w-0 border-0 text-base focus:outline-none bg-transparent"
              />
              <button
                type="button"
                onClick={() => moveTask(i, 'up')}
                disabled={i === 0}
                className="text-gray-400 disabled:opacity-20 px-1"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveTask(i, 'down')}
                disabled={i === tasks.length - 1}
                className="text-gray-400 disabled:opacity-20 px-1"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeTask(i)}
                className="text-gray-400 hover:text-red-400 px-1"
              >
                ✕
              </button>
            </div>
          ))}

          {taskEmojiIndex !== null && (
            <div className="p-3 bg-gray-50 rounded-xl">
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

        <button
          type="button"
          onClick={addTask}
          className="text-blue-500 text-sm font-medium mb-6"
        >
          + Ajouter une tâche
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-4 bg-green-500 text-white rounded-xl text-lg font-semibold active:scale-95 transition-transform mt-auto"
      >
        Enregistrer
      </button>
      <div className="h-6" />
    </div>
  )
}
