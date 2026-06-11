import { ActiveRoutine, RoutineTemplate, Screen } from '../types'
import { Badge, Button, Card, ScreenHeader } from './ui'

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
      <ScreenHeader className="mb-8" onBack={() => setCurrentScreen('parent')} title="Gérer les routines" />

      <div className="space-y-3 mb-6">
        {routineTemplates.map(routine => {
          const hasProgress = activeRoutines
            .filter(ar => ar.templateId === routine.id)
            .some(ar => ar.tasks.some(t => t.done))
          const days = routine.scheduledDays ?? []
          return (
            <Card
              key={routine.id}
              onClick={() => handleEdit(routine.id)}
              className="w-full p-5 flex items-center gap-4"
            >
              <span className="text-3xl" aria-hidden="true">{routine.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-ink truncate">{routine.name}</span>
                  {hasProgress && <Badge tone="success" className="shrink-0">En cours</Badge>}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 0].map(d => (
                      <span
                        key={d}
                        className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                          days.includes(d)
                            ? 'bg-ink text-warm-50'
                            : 'bg-warm-100 text-ink-faint/60'
                        }`}
                      >
                        {DAY_LABELS[d]}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-ink-faint">{routine.tasks.length} tâche{routine.tasks.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <span className="text-ink-faint/60 text-xl" aria-hidden="true">›</span>
            </Card>
          )
        })}
      </div>

      <Button variant="outline" size="xl" onClick={handleAdd}>
        + Ajouter une routine
      </Button>
      <div className="h-6 shrink-0" />
    </div>
  )
}
