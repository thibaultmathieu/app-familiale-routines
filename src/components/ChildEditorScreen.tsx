import { useState } from 'react'
import { Child, Screen } from '../types'
import ChildAvatar, { DEFAULT_AVATAR_PATH } from './ChildAvatar'

const COLOR_PALETTE = [
  '#A78BFA', '#60A5FA', '#F472B6', '#34D399',
  '#FBBF24', '#FB923C', '#F87171', '#A3E635',
]

interface ChildEditorScreenProps {
  children: Child[]
  setCurrentScreen: (screen: Screen) => void
  updateChild: (id: string, updates: Partial<Pick<Child, 'name' | 'photo' | 'color'>>) => void
  addChild: (child: Omit<Child, 'unlockedImages' | 'completedCycles'>) => void
  removeChild: (id: string) => void
}

export default function ChildEditorScreen({
  children,
  setCurrentScreen,
  updateChild,
  addChild,
  removeChild,
}: ChildEditorScreenProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editPhoto, setEditPhoto] = useState('')

  const startEditing = (child: Child) => {
    setEditingId(child.id)
    setEditName(child.name)
    setEditColor(child.color)
    setEditPhoto(child.photo)
  }

  const saveEditing = () => {
    if (!editingId || !editName.trim()) return
    updateChild(editingId, {
      name: editName.trim(),
      color: editColor,
      photo: editPhoto,
    })
    setEditingId(null)
  }

  const cancelEditing = () => {
    setEditingId(null)
  }

  const handleAddChild = () => {
    const id = `child-${Date.now()}`
    addChild({
      id,
      name: `Enfant ${children.length + 1}`,
      photo: DEFAULT_AVATAR_PATH,
      color: COLOR_PALETTE[children.length % COLOR_PALETTE.length],
    })
  }

  const handleRemoveChild = (id: string) => {
    const child = children.find(c => c.id === id)
    if (!child) return
    if (window.confirm(`Supprimer ${child.name} ? Ses routines en cours seront aussi supprimées.`)) {
      removeChild(id)
      if (editingId === id) setEditingId(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        setEditPhoto(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="h-full flex flex-col p-6 max-w-2xl mx-auto overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => setCurrentScreen('parent')}
          className="text-gray-400 text-lg font-medium px-4 py-2"
        >
          ← Retour
        </button>
        <h1 className="text-2xl font-bold text-gray-800">Gérer les enfants</h1>
        <div className="w-24" />
      </div>

      {/* Children list */}
      <div className="space-y-4">
        {children.map(child => (
          <div key={child.id} className="bg-white rounded-2xl p-5 shadow-sm border-2 border-gray-100">
            {editingId === child.id ? (
              /* Edit mode */
              <div className="space-y-4">
                {/* Name */}
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nom de l'enfant"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-blue-300"
                  autoFocus
                />

                {/* Photo */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Photo</p>
                  <div className="flex items-center gap-3">
                    <div className="border-3 rounded-full" style={{ borderColor: editColor }}>
                      <ChildAvatar photo={editPhoto} color={editColor} size={64} />
                    </div>
                    <label className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium active:scale-95 transition-transform hover:bg-gray-200 cursor-pointer">
                      📷 Changer la photo
                      <input
                        type="file"
                        accept="image/*,.heic,.heif"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Couleur</p>
                  <div className="flex gap-2">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        className={`w-10 h-10 rounded-full transition-all ${
                          editColor === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={saveEditing}
                    className="flex-1 py-3 bg-green-400 text-white rounded-xl font-medium active:scale-95 transition-transform"
                  >
                    Enregistrer
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center gap-4">
                <div className="border-3 rounded-full" style={{ borderColor: child.color }}>
                  <ChildAvatar photo={child.photo} color={child.color} size={56} />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-gray-800">{child.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: child.color }} />
                  </div>
                </div>
                <button
                  onClick={() => startEditing(child)}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                >
                  Modifier
                </button>
                {children.length > 1 && (
                  <button
                    onClick={() => handleRemoveChild(child.id)}
                    className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-sm font-medium active:scale-95 transition-transform"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add child button */}
      <button
        onClick={handleAddChild}
        className="mt-6 w-full py-4 bg-white rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-lg font-medium active:scale-95 transition-transform hover:border-gray-400"
      >
        + Ajouter un enfant
      </button>
    </div>
  )
}
