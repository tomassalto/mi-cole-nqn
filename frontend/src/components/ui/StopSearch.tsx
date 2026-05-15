import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import type { Stop } from '@/types/api'
import { useMap } from '@/contexts/MapContext'

export default function StopSearch() {
  const { stops, selectStop } = useMap()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const results = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return stops
      .filter(s => {
        const name = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        return name.includes(q) || s.code?.toLowerCase().includes(q)
      })
      .slice(0, 15)
  }, [query, stops])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results.length])

  const handleSelect = (stop: Stop) => {
    selectStop(stop)
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      handleSelect(results[selectedIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  // Scroll al item seleccionado
  useEffect(() => {
    const el = listRef.current?.children[selectedIndex] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  // Cerrar al hacer clic fuera
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleClickOutside])

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-1.5 rounded-xl bg-white/70 px-3 py-1.5 shadow-sm backdrop-blur-md dark:bg-slate-800/70">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-4 w-4 flex-shrink-0 text-slate-400"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar parada..."
          className="min-w-[140px] bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none dark:text-slate-200 dark:placeholder-slate-500"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setOpen(false)
              inputRef.current?.focus()
            }}
            className="rounded-full p-0.5 text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>

      {open && query && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-800/95"
        >
          {results.map((stop, i) => (
            <button
              key={stop.id}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                i === selectedIndex
                  ? 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'
                  : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => handleSelect(stop)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className={`h-4 w-4 flex-shrink-0 ${
                  i === selectedIndex ? 'text-sky-500' : 'text-slate-400'
                }`}
              >
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 110-12 6 6 0 010 12zm0-9a3 3 0 100 6 3 3 0 000-6z" />
              </svg>
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium">{stop.name}</span>
                {stop.code && (
                  <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                    Código: {stop.code}
                  </span>
                )}
              </div>
              {stop.code && (
                <span className="hidden flex-shrink-0 text-xs text-slate-400 sm:block dark:text-slate-500">
                  {stop.code}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {open && query && results.length === 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-xl border border-slate-200/80 bg-white/95 p-4 text-center text-sm text-slate-400 shadow-lg backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-800/95">
          No se encontraron paradas
        </div>
      )}
    </div>
  )
}
