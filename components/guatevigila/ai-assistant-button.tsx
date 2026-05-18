'use client'

import { useState, useRef } from 'react'
import { Bot, ArrowRight, Users, TriangleAlert, UserX } from 'lucide-react'
import { useAIResults } from './ai-context'
// pathname guard removed — each page that imports this controls where it appears
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const SUGGESTIONS = [
  { label: 'Top proveedores por monto', icon: Users, q: 'top proveedores que más han generado' },
  { label: 'Entidades con más alertas', icon: TriangleAlert, q: 'entidades con más alertas de riesgo' },
  { label: 'Contratos sin competencia', icon: UserX, q: 'proveedores únicos en licitaciones' },
]

export function AIAssistantButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const { search } = useAIResults()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return
    setIsOpen(false)
    setQuery('')
    await search(searchQuery)
  }

  return (
    <>
      {/* FAB */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full px-5 py-3 shadow-lg gap-2"
        >
          <Bot className="w-4 h-4" />
          Preguntar a IA
        </Button>
      </div>

      {/* Dialog — Radix handles: focus trap, Escape, scroll lock, aria-modal */}
      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setQuery('') }}>
        <DialogContent
          className="max-w-md p-0 gap-0 overflow-hidden"
          showCloseButton={false}
          // auto-focus the input instead of the default first focusable element
          onOpenAutoFocus={(e) => { e.preventDefault(); inputRef.current?.focus() }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-background" />
            </div>
            <DialogHeader className="flex-1 min-w-0 gap-0 text-left">
              <DialogTitle className="text-sm font-semibold leading-none">
                Asistente GuateVigila
              </DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Investigador inteligente
              </DialogDescription>
            </DialogHeader>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              ¿Qué quieres investigar en los datos de Guatecompras?
            </p>

            {/* Suggestions */}
            <div className="space-y-1.5">
              {SUGGESTIONS.map(({ label, icon: Icon, q }) => (
                <button
                  key={label}
                  onClick={() => handleSearch(q)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border rounded-lg text-left hover:bg-muted hover:border-foreground/20 transition-all group"
                >
                  <Icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                  <span className="text-sm text-foreground font-medium">{label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>

            {/* Free-form input */}
            <form
              onSubmit={(e) => { e.preventDefault(); void handleSearch(query) }}
              className="relative"
            >
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="pr-12 h-11"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 w-8 rounded-md"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
