import { useState, useEffect } from 'react'
import { ActiveRoutine, Child, RoutineTemplate, Screen, TaskTemplate } from '../types'
import DayOfWeekPicker from './DayOfWeekPicker'
import EmojiPicker from './EmojiPicker'
import { Button, FieldLabel, IconButton, TextInput } from './ui'

interface RoutineEditorScreenProps {
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  children: Child[]
  editorRoutineId: string | null
  setCurrentScreen: (screen: Screen) => void
  setEditorRoutineId: (id: string | null) => void
  updateRoutine: (id: string, updates: Partial<RoutineTemplate>) => void
  deleteRoutine: (id: string) => void
}

export default function RoutineEditorScreen({
  routineTemplates,
  activeRoutines,
  children,
  editorRoutineId,
  setCurrentScreen,
  setEditorRoutineId,
  updateRoutine,
  deleteRoutine,
}: RoutineEditorScreenProps) {
  const routine = routineTemplates.find(r => r.id === editorRoutineId)

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

  if (!routine || !editorRoutineId) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-ink-faint">Routine introuvable</p>
      </div>
    )
  }

  const hasActiveProgress = activeRoutines
    .filter(ar => ar.templateId === editorRoutineId)
    .some(ar => ar.tasks.some(t => t.done))

  const goBack = () => {
    setEditorRoutineId(null)
    setCurrentScreen('routine-list')
  }

  const handleSave = () => {
    updateRoutine(editorRoutineId, {
      name: name.trim() || 'Sans nom',
      icon,
      scheduledDays: days,
      tasks,
    })
    goBack()
  }

  const handleDelete = () => {
    const msg = hasActiveProgress
      ? 'Cette routine est en cours avec des tâches accomplies. Supprimer ? La progression sera perdue.'
      : 'Supprimer cette routine ? Cette action est irréversible.'
    if (window.confirm(msg)) {
      deleteRoutine(editorRoutineId)
      setEditorRoutineId(null)
      setCurrentScreen('routine-list')
    }
  }

  const addTask = () => {
    const id = `t-${Date.now()}`
    setTasks([...tasks, { id, label: '', icon: '📋' }])
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goBack}
          className="min-h-12 px-4 py-2 -ml-4 rounded-2xl text-ink-faint text-lg font-display font-medium active:scale-95 transition-transform"
        >
          ← Retour
        </button>
        <button
          onClick={handleDelete}
          className="min-h-12 px-4 py-2 rounded-2xl text-danger-400 text-sm font-semibold active:scale-95 transition-transform"
        >
          Supprimer
        </button>
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
              {/* Task emoji */}
              <button
                type="button"
                onClick={() => setTaskEmojiIndex(taskEmojiIndex === i ? null : i)}
                aria-label="Changer l'icône de la tâche"
                className="text-xl w-11 h-11 flex items-center justify-center rounded-lg hover:bg-warm-100 active:scale-90 transition-transform shrink-0"
              >
                {task.icon}
              </button>

              {/* Label */}
              <TextInput
                variant="bare"
                value={task.label}
                onChange={v => updateTask(i, { label: v })}
                placeholder="Nom de la tâche"
              />

              {/* Child filter */}
              <select
                value={task.childIds ? JSON.stringify(task.childIds) : ''}
                onChange={e => {
                  const val = e.target.value
                  updateTask(i, { childIds: val ? JSON.parse(val) : undefined })
                }}
                aria-label="Pour quel enfant ?"
                className="text-sm min-h-11 bg-warm-50 rounded-lg px-2 border border-line text-ink-soft shrink-0"
              >
                <option value="">Tous</option>
                {children.map(c => (
                  <option key={c.id} value={JSON.stringify([c.id])}>{c.name}</option>
                ))}
              </select>

              {/* Up/Down */}
              <IconButton size={44} ariaLabel="Monter la tâche" disabled={i === 0} onClick={() => moveTask(i, 'up')} className="text-ink-faint hover:bg-warm-100">
                ↑
              </IconButton>
              <IconButton size={44} ariaLabel="Descendre la tâche" disabled={i === tasks.length - 1} onClick={() => moveTask(i, 'down')} className="text-ink-faint hover:bg-warm-100">
                ↓
              </IconButton>

              {/* Delete */}
              <IconButton size={44} ariaLabel="Supprimer la tâche" onClick={() => removeTask(i)} className="text-ink-faint hover:text-danger-400 hover:bg-danger-50">
                ✕
              </IconButton>
            </div>
          ))}

          {/* Task emoji picker (shown below the task row) */}
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

      {/* Save button */}
      <div className="mt-auto">
        <Button variant="primary" size="xl" onClick={handleSave}>
          Enregistrer
        </Button>
      </div>

      <div className="h-6 shrink-0" />
    </div>
  )
}
