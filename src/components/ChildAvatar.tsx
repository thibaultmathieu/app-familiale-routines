interface ChildAvatarProps {
  photo: string
  color: string
  size?: number
  className?: string
  /** Texte alternatif — laisser vide quand l'avatar est décoratif (nom affiché à côté). */
  alt?: string
}

const DEFAULT_AVATAR_PATH = '/profiles/default-avatar.svg'

export function isDefaultAvatar(photo: string): boolean {
  return !photo || photo.includes('default-avatar') || photo.includes('default-girl') || photo.includes('default-boy')
}

export default function ChildAvatar({ photo, color, size = 56, className = '', alt = '' }: ChildAvatarProps) {
  if (isDefaultAvatar(photo)) {
    return (
      <svg
        viewBox="0 0 100 100"
        fill="none"
        width={size}
        height={size}
        className={`rounded-full ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        role={alt ? 'img' : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
      >
        <circle cx="50" cy="50" r="48" fill={color} opacity="0.2" />
        <circle cx="50" cy="38" r="16" fill={color} opacity="0.7" />
        <ellipse cx="50" cy="78" rx="26" ry="18" fill={color} opacity="0.7" />
      </svg>
    )
  }

  return (
    <img
      src={photo}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
    />
  )
}

export { DEFAULT_AVATAR_PATH }
