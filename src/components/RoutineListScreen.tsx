import { ActiveRoutine, RoutineTemplate, Screen } from '../types'

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']

interface RoutineListScreenProps {
  routineTemplates: RoutineTemplate[]
  activeRoutines: ActiveRoutine[]
  setCurrentScreen: (screen: Screen) => void
  setEditorRoutineId: (id: string | null) => void
  addRoutine: (template: Omit<RoutineTemplate, 'id'>) => string
}

export default function RoutineListScreen({
  routineTemplates,
  activeRoutines,
  setCurrentScreen,
  setEditorRoutineId,
  addRoutine,
}: RoutineListScreenProps) {
  const handleEdit = (id: string) => {
    setEditorRoutineId(id)
    setCurrentScreen('routine-editor')
  }

  const handleAdd = () => {
    const id = addRoutine({
      name: 'Nouvelle routine',
      icon: '📋',
      scheduledDays: [],
      tasks: [],
    })
    setEditorRoutineId(id)
    setCurrentScreen('routine-editor')
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentScreen('parent')}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Gérer les routines</h1>
        <div className="w-24" />
      </div>

      <div className="space-y-3 mb-6">
        {routineTemplates.map(routine => {
          const isActive = activeRoutines.some(ar => ar.templateId === routine.id)
          const days = routine.scheduledDays ?? []
          return (
            <button
              key={routine.id}
              onClick={() => handleEdit(routine.id)}
              className="w-full bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100 flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
            >
              <span className="text-3xl">{routine.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800 truncate">{routine.name}</span>
                  {isActive && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600 shrink-0">
                      EN COURS
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(d => (
                      <span
                        key={d}
                        className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                          days.includes(d)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-300'
                        }`}
                      >
                        {DAY_LABELS[d]}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">{routine.tasks.length} tâche{routine.tasks.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <span className="text-gray-300 text-xl">›</span>
            </button>
          )
        })}
      </div>

      <button
        onClick={handleAdd}
        className="w-full bg-white rounded-2xl px-6 py-4 shadow-sm border-2 border-dashed border-gray-300 text-gray-500 text-lg font-medium active:scale-95 transition-transform"
      >
        + Ajouter une routine
      </button>
    </div>
  )
}
