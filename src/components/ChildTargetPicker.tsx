import { Child } from '../types'
import { isAllTargets, toggleChildTarget } from '../data/childTarget'
import { childTextColor, tint } from '../theme'
import { Pill } from './ui'

interface ChildTargetPickerProps {
  children: Pick<Child, 'id' | 'name' | 'color'>[]
  /** Cible courante. `undefined` = tous les enfants. */
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
}

/**
 * Sélecteur de cible d'enfants par pastilles (Tous • Enfant A • Enfant B • …).
 * Multi-sélection avec une sémantique tactile intuitive (cf. `childTarget.ts`).
 * Utilisé pour l'assignation par tâche (éditeur) et la cible d'une routine perso.
 */
export default function ChildTargetPicker({ children, value, onChange }: ChildTargetPickerProps) {
  const allIds = children.map(c => c.id)
  const all = isAllTargets(value, allIds)

  return (
    <div className="flex flex-wrap gap-2">
      <Pill
        selected={all}
        selectedClassName="bg-ink text-warm-50 border-ink"
        onClick={() => onChange(undefined)}
      >
        Tous
      </Pill>
      {children.map(child => {
        const selected = !all && !!value?.includes(child.id)
        return (
          <Pill
            key={child.id}
            selected={selected}
            selectedClassName="border-2"
            style={selected ? {
              borderColor: child.color,
              backgroundColor: tint(child.color, 0.14),
              color: childTextColor(child.color),
            } : undefined}
            onClick={() => onChange(toggleChildTarget(value, child.id, allIds))}
          >
            {child.name}
          </Pill>
        )
      })}
    </div>
  )
}
