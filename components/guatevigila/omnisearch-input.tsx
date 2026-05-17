'use client'

import { useEffect, useRef, useId, useCallback } from 'react'
import { useOmnisearch } from '@/lib/hooks/use-omnisearch'
import { SearchResultRow } from './search-result-row'

export function OmnisearchInput() {
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)
  const { q, results, loading, isOpen, keyboardIndex, setKeyboardIndex, onChange, navigate } = useOmnisearch()

  const close = useCallback(() => setKeyboardIndex(-1), [setKeyboardIndex])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setKeyboardIndex((i) => Math.min(i + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setKeyboardIndex((i) => Math.max(i - 1, -1))
        break
      case 'Enter':
        if (keyboardIndex >= 0 && results[keyboardIndex]) {
          e.preventDefault()
          navigate(results[keyboardIndex].href)
        }
        break
      case 'Escape':
        e.preventDefault()
        close()
        inputRef.current?.blur()
        break
      case 'Tab':
        close()
        break
    }
  }

  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      close()
    }
  }

  useEffect(() => {
    if (keyboardIndex < 0 || !listboxRef.current) return
    listboxRef.current
      .querySelector(`#${CSS.escape(`${listboxId}-option-${keyboardIndex}`)}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [keyboardIndex, listboxId])

  const activeDescendant = keyboardIndex >= 0 ? `${listboxId}-option-${keyboardIndex}` : undefined

  return (
    <div ref={containerRef} className="w-full max-w-xl relative">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none" aria-hidden="true">
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Buscar entidades, proveedores o alertas..."
        className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant focus:outline-none focus:border-primary text-sm rounded-sm"
        autoComplete="off"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant shadow-lg z-50 rounded-sm overflow-hidden">
          {loading ? (
            <p role="status" className="px-4 py-3 text-sm text-on-surface-variant">Buscando...</p>
          ) : results.length === 0 ? (
            <p role="status" className="px-4 py-3 text-sm text-on-surface-variant">Sin resultados</p>
          ) : (
            <div
              ref={listboxRef}
              id={listboxId}
              role="listbox"
              aria-label="Resultados de búsqueda"
              className="overflow-y-auto max-h-[220px] overscroll-contain"
            >
              {results.map((result, i) => (
                <SearchResultRow
                  key={result.id}
                  id={`${listboxId}-option-${i}`}
                  result={result}
                  isActive={i === keyboardIndex}
                  onSelect={() => navigate(result.href)}
                  onMouseEnter={() => setKeyboardIndex(i)}
                  className={i > 0 ? 'border-t border-outline-variant' : ''}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
