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
}

export default function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          type="button"
          onClick={() => onChange(emoji)}
          className={`w-10 h-10 text-xl rounded-lg flex items-center justify-center transition-colors ${
            value === emoji
              ? 'bg-blue-100 ring-2 ring-blue-400'
              : 'hover:bg-gray-100'
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}
