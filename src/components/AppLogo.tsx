interface AppLogoProps {
  size?: number
  className?: string
}

/** Logo de l'app (soleil miel + coche) — même dessin que public/icons/icon.svg et le splash. */
export default function AppLogo({ size = 96, className = '' }: AppLogoProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="116" fill="#FDFBF7" />
      <g stroke="#ECC178" strokeWidth="22" strokeLinecap="round">
        <line x1="256" y1="64" x2="256" y2="100" />
        <line x1="256" y1="412" x2="256" y2="448" />
        <line x1="64" y1="256" x2="100" y2="256" />
        <line x1="412" y1="256" x2="448" y2="256" />
        <line x1="120.2" y1="120.2" x2="145.7" y2="145.7" />
        <line x1="366.3" y1="366.3" x2="391.8" y2="391.8" />
        <line x1="120.2" y1="391.8" x2="145.7" y2="366.3" />
        <line x1="366.3" y1="145.7" x2="391.8" y2="120.2" />
      </g>
      <circle cx="256" cy="256" r="118" fill="#E8A33D" />
      <path
        d="M 200 258 L 240 298 L 318 212"
        fill="none"
        stroke="#FDFBF7"
        strokeWidth="30"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
