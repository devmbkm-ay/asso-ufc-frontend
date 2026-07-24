type LogoProps = {
  size?: number
  className?: string
}

/**
 * Mark "L'Abri" — un arc de protection au-dessus d'un point : le foyer
 * gardé au sec. Couleurs tirées des tokens CSS (--sidebar / --primary),
 * donc toujours synchronisé avec la palette de marque définie dans
 * globals.css sans valeur codée en dur ici.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="28" cy="28" r="27" fill="var(--sidebar)" />
      <path
        d="M14 32 A14 14 0 0 1 42 32"
        stroke="var(--primary)"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <circle cx="28" cy="33" r="4.4" fill="var(--primary)" />
    </svg>
  )
}
