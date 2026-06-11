import { useState, useEffect } from 'react'
import { ActiveRoutine, Child, RoutineTemplate, Screen, TaskTemplate } from '../types'
import DayOfWeekPicker from './DayOfWeekPicker'
import EmojiPicker from './EmojiPicker'

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
        <p className="text-gray-400">Routine introuvable</p>
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
        <button onClick={goBack} className="text-gray-400 text-lg font-medium px-4 py-2">
          ← Retour
        </button>
        <button
          onClick={handleDelete}
          className="text-red-400 text-sm font-medium px-4 py-2"
        >
          Supprimer
        </button>
      </div>

      <div>
        {/* Name */}
        <label className="block text-sm font-semibold text-gray-500 mb-2">Nom</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg mb-5 focus:border-blue-300"
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
              {/* Task emoji */}
              <button
                type="button"
                onClick={() => setTaskEmojiIndex(taskEmojiIndex === i ? null : i)}
                className="text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                {task.icon}
              </button>

              {/* Label */}
              <input
                type="text"
                value={task.label}
                onChange={e => updateTask(i, { label: e.target.value })}
                placeholder="Nom de la tâche"
                className="flex-1 min-w-0 border-0 text-base bg-transparent"
              />

              {/* Child filter */}
              <select
                value={task.childIds ? JSON.stringify(task.childIds) : ''}
                onChange={e => {
                  const val = e.target.value
                  updateTask(i, { childIds: val ? JSON.parse(val) : undefined })
                }}
                className="text-xs bg-gray-50 rounded-lg px-2 py-1 border border-gray-200"
              >
                <option value="">Tous</option>
                {children.map(c => (
                  <option key={c.id} value={JSON.stringify([c.id])}>{c.name}</option>
                ))}
              </select>

              {/* Up/Down */}
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

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeTask(i)}
                className="text-gray-400 hover:text-red-400 px-1"
              >
                ✕
              </button>
            </div>
          ))}

          {/* Task emoji picker (shown below the task row) */}
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

      {/* Save button */}
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
