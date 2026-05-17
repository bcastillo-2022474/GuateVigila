'use client'

import { useState, useRef, useEffect } from 'react'
import { useAIResults } from './ai-context'

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { search } = useAIResults()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    setIsOpen(false)
    setQuery(searchQuery)
    await search(searchQuery)
  }

  function closeAndReset() {
    setIsOpen(false)
    setQuery('')
  }

  return (
    <>
      <div className="fixed bottom-0 right-0 z-50 p-6 pointer-events-none">
        <div className="max-w-[1200px] mx-auto w-full flex justify-end">
          <button
            onClick={() => setIsOpen(true)}
            className="pointer-events-auto bg-surface border border-outline-variant rounded-full w-72 flex items-center gap-2 px-4 py-2 text-on-surface-variant hover:border-primary hover:text-primary transition-all shadow-lg"
          >
            <span className="material-symbols-outlined text-primary">smart_toy</span>
            <span className="text-xs font-semibold tracking-wide">Preguntar a IA...</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeAndReset}
          />

          <div className="relative w-full max-w-md bg-surface border border-outline-variant rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 px-6 py-4 border-b border-outline-variant bg-surface-container-low">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">smart_toy</span>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-on-surface">Asistente GuateVigila</h2>
                <p className="text-xs text-on-surface-variant">Investigador inteligente</p>
              </div>
              <button
                onClick={closeAndReset}
                className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface-variant">close</span>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <p className="text-sm text-center text-on-surface-variant">
                ¿Qué quieres investigar en los datos de Guatecompras?
              </p>

              <div className="space-y-2">
                {[
                  { label: 'Top proveedores por monto', icon: 'group', q: 'top proveedores que más han generado' },
                  { label: 'Entidades con más alertas', icon: 'warning', q: 'entidades con más alertas de riesgo' },
                  { label: 'Contratos sin competencia', icon: 'person_off', q: 'proveedores únicos en licitaciones' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => handleSearch(item.q)}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl text-left hover:border-primary/50 hover:bg-surface-container-high transition-all group"
                  >
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">{item.icon}</span>
                    <span className="text-sm text-on-surface group-hover:text-primary font-medium">{item.label}</span>
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleSearch(query)
                }}
                className="relative"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Escribe tu pregunta..."
                  className="w-full px-4 py-4 bg-surface-container-lowest border border-outline-variant rounded-xl text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary pr-14"
                />
                <button
                  type="submit"
                  disabled={!query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
