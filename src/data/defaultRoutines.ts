import { RoutineTemplate, Child } from '../types'

export const defaultRoutines: RoutineTemplate[] = [
  {
    id: 'morning',
    name: 'Routine du matin',
    icon: '🌅',
    type: 'fixed',
    tasks: [
      { id: 'm1', label: 'je fais mon lit', icon: '🛏️' },
      { id: 'm2', label: 'je m\'habille', icon: '👕' },
      { id: 'm3', label: 'je débarrasse la table du petit dej', icon: '🍽️' },
    ],
  },
  {
    id: 'afterschool',
    name: 'Retour de l\'école',
    icon: '🏫',
    type: 'fixed',
    tasks: [
      { id: 'a1', label: 'j\'ai bien bu toute ma gourde aujourd\'hui', icon: '💧' },
      { id: 'a2', label: 'je me lave les mains', icon: '🧼' },
      { id: 'a3', label: 'je bois un verre d\'eau', icon: '🥤' },
      { id: 'a4', label: 'je finis mes devoirs', icon: '📚' },
      { id: 'a5', label: 'je prends mon bain', icon: '🛁' },
    ],
  },
  {
    id: 'evening',
    name: 'Routine du soir',
    icon: '🌙',
    type: 'fixed',
    tasks: [
      { id: 'e1', label: 'je débarrasse la table', icon: '🍽️' },
      { id: 'e2', label: 'je me lave les dents', icon: '🪥' },
    ],
  },
]

export const defaultChildren: Child[] = [
  {
    id: 'evangelina',
    name: 'Evangéline',
    photo: '/profiles/evangelina.jpeg',
    color: '#A78BFA',
    unlockedImages: [],
    completedCycles: 0,
  },
  {
    id: 'noah',
    name: 'Noah',
    photo: '/profiles/noah.jpeg',
    color: '#60A5FA',
    unlockedImages: [],
    completedCycles: 0,
  },
]
