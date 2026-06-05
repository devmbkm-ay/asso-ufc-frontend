import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MONTH_FR = ['jan', 'fév', 'mar', 'avr', 'mai', 'juin', 'juil', 'août', 'sep', 'oct', 'nov', 'déc']

export const MEMBER_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active:    { label: 'Actif',      className: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
  inactive:  { label: 'Inactif',    className: 'bg-zinc-800 text-zinc-400 border-zinc-700' },
  suspended: { label: 'Suspendu',   className: 'bg-red-900/40 text-red-400 border-red-800/50' },
  honorary:  { label: 'Honoraire',  className: 'bg-purple-900/40 text-purple-400 border-purple-800/50' },
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function fmtEur(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
}
