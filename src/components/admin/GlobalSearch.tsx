'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { search as searchApi } from '@/lib/api'
import { Dialog, DialogContent, DialogPortal, DialogOverlay } from '@/components/ui/dialog'
import { Search, Users, Calendar, Heart, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SearchResultItem } from '@/lib/types'

const TYPE_META: Record<SearchResultItem['type'], { label: string; icon: React.ElementType }> = {
  member: { label: 'Membre', icon: Users },
  event: { label: 'Événement', icon: Calendar },
  collecte: { label: 'Collecte', icon: Heart },
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function onOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setQuery('')
      setDebouncedQuery('')
      setActiveIndex(0)
    }
  }

  const { data: results, isFetching } = useQuery({
    queryKey: ['global-search', debouncedQuery],
    queryFn: () => searchApi.global(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 2,
  })

  const items = results ?? []

  function go(item: SearchResultItem) {
    setOpen(false)
    router.push(item.href)
  }

  function onInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && items[activeIndex]) {
      e.preventDefault()
      go(items[activeIndex])
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-sidebar-foreground/5 px-2.5 py-1.5 text-xs text-sidebar-foreground/55 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-foreground/8"
      >
        <Search size={13} />
        <span className="flex-1 text-left">Rechercher…</span>
        <kbd className="rounded border border-sidebar-border bg-sidebar px-1 py-0.5 font-sans text-[10px]">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent
            showCloseButton={false}
            initialFocus={inputRef}
            className="top-24 max-w-lg -translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-lg"
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Search size={16} className="shrink-0 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setActiveIndex(0) }}
                onKeyDown={onInputKeyDown}
                placeholder="Rechercher un membre, un événement, une collecte…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="max-h-80 overflow-y-auto p-1.5">
              {debouncedQuery.trim().length < 2 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Tape au moins 2 caractères pour lancer la recherche.
                </p>
              )}
              {debouncedQuery.trim().length >= 2 && isFetching && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">Recherche…</p>
              )}
              {debouncedQuery.trim().length >= 2 && !isFetching && items.length === 0 && (
                <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Aucun résultat pour « {debouncedQuery} ».
                </p>
              )}
              {items.map((item, i) => {
                const { label, icon: Icon } = TYPE_META[item.type]
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => go(item)}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors',
                      i === activeIndex ? 'bg-accent/10 text-foreground' : 'text-foreground/85',
                    )}
                  >
                    <Icon size={15} className="shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{item.title}</span>
                      {item.subtitle && (
                        <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                      )}
                    </span>
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                    {i === activeIndex && <CornerDownLeft size={12} className="shrink-0 text-muted-foreground" />}
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  )
}
