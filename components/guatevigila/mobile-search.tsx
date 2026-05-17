'use client'

import { useEffect, useRef, useId } from 'react'
import { useOmnisearch } from '@/lib/hooks/use-omnisearch'
import { SearchResultRow } from './search-result-row'

interface MobileSearchProps {
  onClose: () => void
}

export function MobileSearch({ onClose }: MobileSearchProps) {
  const listboxId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const { q, results, loading, isOpen, keyboardIndex, setKeyboardIndex, onChange, navigate } = useOmnisearch()

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || !overlayRef.current) return
      const focusable = overlayRef.current.querySelectorAll<HTMLElement>('input, button')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          onClose()
        }
        break
    }
  }

  const activeDescendant = keyboardIndex >= 0 ? `${listboxId}-option-${keyboardIndex}` : undefined

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label="Búsqueda"
      className="fixed inset-0 z-50 bg-surface flex flex-col md:hidden"
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-outline-variant shrink-0">
        <span className="material-symbols-outlined text-outline" aria-hidden="true">search</span>
        <input
          ref={inputRef}
          type="text"
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar entidades, proveedores o alertas..."
          className="flex-1 bg-transparent focus:outline-none text-sm text-on-surface placeholder:text-on-surface-variant"
          autoComplete="off"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={activeDescendant}
        />
        <button
          onClick={onClose}
          className="p-1 rounded-sm hover:bg-surface-container-low transition-colors"
          aria-label="Cerrar búsqueda"
        >
          <span className="material-symbols-outlined text-on-surface">close</span>
        </button>
      </div>

      <div
        id={listboxId}
        role="listbox"
        aria-label="Resultados de búsqueda"
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {loading ? (
          <p role="status" className="px-4 py-8 text-sm text-on-surface-variant text-center">Buscando...</p>
        ) : results.length > 0 ? (
          results.map((result, i) => (
            <SearchResultRow
              key={result.id}
              id={`${listboxId}-option-${i}`}
              result={result}
              isActive={i === keyboardIndex}
              onSelect={() => { navigate(result.href); onClose() }}
              onMouseEnter={() => setKeyboardIndex(i)}
              onMouseLeave={() => setKeyboardIndex(-1)}
              className={`py-4 active:bg-surface-container-high ${i > 0 ? 'border-t border-outline-variant' : ''}`}
            />
          ))
        ) : isOpen ? (
          <p role="status" className="px-4 py-8 text-sm text-on-surface-variant text-center">Sin resultados para &ldquo;{q}&rdquo;</p>
        ) : (
          <p className="px-4 py-8 text-sm text-on-surface-variant text-center">Escribe al menos 2 caracteres para buscar</p>
        )}
      </div>
    </div>
  )
}
