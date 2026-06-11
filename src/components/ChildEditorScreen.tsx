import { useState } from 'react'
import { Child, Screen } from '../types'
import ChildAvatar, { DEFAULT_AVATAR_PATH } from './ChildAvatar'
import { COLOR_PALETTE } from '../theme'
import { Button, Card, ScreenHeader, TextInput } from './ui'

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
      <ScreenHeader className="mb-8" onBack={() => setCurrentScreen('parent')} title="Gérer les enfants" />

      {/* Children list */}
      <div className="space-y-4">
        {children.map(child => (
          <Card key={child.id} className="p-5">
            {editingId === child.id ? (
              /* Edit mode */
              <div className="space-y-4">
                {/* Name */}
                <TextInput value={editName} onChange={setEditName} placeholder="Nom de l'enfant" autoFocus />

                {/* Photo */}
                <div>
                  <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-2">Photo</p>
                  <div className="flex items-center gap-3">
                    <div className="border-[3px] rounded-full" style={{ borderColor: editColor }}>
                      <ChildAvatar photo={editPhoto} color={editColor} size={64} />
                    </div>
                    <label className="min-h-12 px-4 py-2 bg-warm-100 text-ink-soft rounded-xl text-sm font-semibold inline-flex items-center active:scale-95 transition-transform hover:bg-warm-200 cursor-pointer">
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
                  <p className="text-sm font-bold text-ink-faint uppercase tracking-wide mb-2">Couleur</p>
                  <div className="flex gap-2 flex-wrap">
                    {COLOR_PALETTE.map(color => (
                      <button
                        key={color}
                        onClick={() => setEditColor(color)}
                        aria-label={`Couleur ${color}`}
                        aria-pressed={editColor === color}
                        className={`w-12 h-12 rounded-full transition-all active:scale-90 ${
                          editColor === color ? 'ring-[3px] ring-offset-2 ring-ink-faint scale-110' : ''
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button variant="primary" size="lg" className="flex-1" onClick={saveEditing}>
                    Enregistrer
                  </Button>
                  <Button variant="soft" size="lg" onClick={cancelEditing}>
                    Annuler
                  </Button>
                </div>
              </div>
            ) : (
              /* View mode */
              <div className="flex items-center gap-4">
                <div className="border-[3px] rounded-full" style={{ borderColor: child.color }}>
                  <ChildAvatar photo={child.photo} color={child.color} size={56} alt={`Photo de ${child.name}`} />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-display font-semibold text-ink">{child.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: child.color }} />
                  </div>
                </div>
                <Button variant="success-soft" size="md" onClick={() => startEditing(child)}>
                  Modifier
                </Button>
                {children.length > 1 && (
                  <Button variant="danger-soft" size="md" onClick={() => handleRemoveChild(child.id)}>
                    Supprimer
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Add child button */}
      <Button variant="outline" size="xl" className="mt-6" onClick={handleAddChild}>
        + Ajouter un enfant
      </Button>
      <div className="h-6 shrink-0" />
    </div>
  )
}
