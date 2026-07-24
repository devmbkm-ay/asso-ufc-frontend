import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
    variant?: 'full' | 'icon'
    size?: 'sm' | 'md' | 'lg'
    href?: string
    className?: string
}

const sizeMap = {
    full: { sm: 'h-8', md: 'h-12', lg: 'h-16' },
    icon: { sm: 'h-8', md: 'h-10', lg: 'h-12' }
}

export function Logo({ variant = 'full', size = 'md', href = '/', className }: LogoProps) {
    const height = sizeMap[variant][size]

    const content = (
        <div className={cn('flex items-center', className)}>
            {variant === 'full' ? (
                <svg viewBox="0 0 1200 450" className={`${height} w-auto`} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#FFC700', stopOpacity: 1 }} />
                        </linearGradient>
                        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                        </filter>
                    </defs>

                    <g filter="url(#shadow)">
                        <rect x="20" y="30" width="360" height="390" rx="45" fill="#001a4d" />
                        <path d="M 80 120 A 130 130 0 0 1 240 70" stroke="#FFD700" strokeWidth="18" fill="none" strokeLinecap="round" />
                        <path d="M 95 270 A 130 130 0 0 0 130 350" stroke="#1a8a3e" strokeWidth="16" fill="none" strokeLinecap="round" />
                        <path d="M 310 300 A 130 130 0 0 1 270 360" stroke="#e63946" strokeWidth="16" fill="none" strokeLinecap="round" />
                        <text x="200" y="280" fontFamily="Arial, sans-serif" fontSize="140" fontWeight="900" fill="white" textAnchor="middle" letterSpacing="8">FMA</text>
                    </g>

                    <g>
                        <text x="460" y="110" fontFamily="Arial, sans-serif" fontSize="32" fontWeight="300" fill="#001a4d" letterSpacing="4">FONDATION</text>
                        <text x="460" y="190" fontFamily="Arial, sans-serif" fontSize="72" fontWeight="900" fill="#001a4d" letterSpacing="2">MÉTÉO</text>
                        <text x="460" y="270" fontFamily="Arial, sans-serif" fontSize="72" fontWeight="900" fill="#1a8a3e" letterSpacing="2">ASSISTANCE</text>
                        <line x1="460" y1="295" x2="1100" y2="295" stroke="#FFD700" strokeWidth="6" strokeLinecap="round" />
                        <text x="460" y="360" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="400" fill="#333" letterSpacing="3">L'UNION FAIT LA FORCE</text>
                    </g>
                </svg>
            ) : (
                <svg viewBox="0 0 200 200" className={`${height} w-auto`} xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <filter id="shadowIcon" x="-50%" y="-50%" width="200%" height="200%">
                            <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.2" />
                        </filter>
                    </defs>

                    <rect x="0" y="0" width="200" height="200" rx="32" fill="#001a4d" />
                    <path d="M 40 60 A 70 70 0 0 1 120 30" stroke="#FFD700" strokeWidth="12" fill="none" strokeLinecap="round" />
                    <path d="M 50 140 A 70 70 0 0 0 65 170" stroke="#1a8a3e" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <path d="M 155 150 A 70 70 0 0 1 135 175" stroke="#e63946" strokeWidth="10" fill="none" strokeLinecap="round" />
                    <text x="100" y="130" fontFamily="Arial, Helvetica, sans-serif" fontSize="70" fontWeight="900" fill="white" textAnchor="middle" dominantBaseline="middle" letterSpacing="2">FMA</text>
                </svg>
            )}
        </div>
    )

    if (href) {
        return <Link href={href}>{content}</Link>
    }

    return content
}

export default Logo
