const EMOJIS = [
  // Quotidien & maison
  '🌅', '🌙', '🏠', '🛏️', '💤', '⏰', '👕', '🧹', '🧺', '🧼',
  '🛁', '🪥', '🚽', '💧', '🥤', '🍳', '🍽️', '🥗', '🎒', '📋',
  // École & activités
  '🏫', '📚', '✏️', '🎵', '🎨', '🎭', '🎮', '📱', '🧸', '✨',
  // Sports
  '⚽', '🏀', '🎾', '🏐', '🥋', '💃', '🩰', '👟', '🏊', '🚴',
  '🤸', '⛷️', '🧗', '🏇', '🎯',
  // Nature & animaux
  '🐕', '🐈', '🌳', '🌻', '🦋',
]

interface EmojiPickerProps {
  value: string
  onChange: (emoji: string) => void
  /** Liste d'emojis alternative (ex. bons cadeaux) — défaut : tâches/routines. */
  emojis?: string[]
}

export default function EmojiPicker({ value, onChange, emojis = EMOJIS }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-1">
      {emojis.map(emoji => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          aria-pressed={value === emoji}
          className={`w-12 h-12 text-2xl rounded-xl flex items-center justify-center transition-colors active:scale-90 ${
            value === emoji
              ? 'bg-honey-100 ring-2 ring-honey-400'
              : 'hover:bg-warm-100'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
