'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'

interface AIMatch {
  type: 'entity' | 'supplier' | 'alert'
  id: string
  title: string
  subtitle: string
  matchReason: string
  relevanceScore: number
  riskLevel?: 'critical' | 'high' | 'medium' | 'low'
  amount?: number
  signalType?: string
}

interface AISearchResponse {
  brief: string
  matches: AIMatch[]
  queryInterpretation: string
}

interface AIContextValue {
  results: AISearchResponse | null
  isSearching: boolean
  lastQuery: string
  search: (query: string) => Promise<void>
  dismiss: () => void
}

const AIContext = createContext<AIContextValue | null>(null)

export function useAIResults() {
  const ctx = useContext(AIContext)
  if (!ctx) throw new Error('useAIResults must be used within AIResultsProvider')
  return ctx
}

export function AIResultsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [results, setResults] = useState<AISearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState('')
  const activeRequestRef = useRef<AbortController | null>(null)

  const dismiss = useCallback(() => {
    activeRequestRef.current?.abort()
    activeRequestRef.current = null
    setResults(null)
    setLastQuery('')
    setIsSearching(false)
  }, [])

  useEffect(() => {
    if (pathname === '/alertas') return
    dismiss()
  }, [pathname, dismiss])

  const search = useCallback(async (query: string) => {
    const normalizedQuery = query?.trim()
    if (!normalizedQuery) return

    activeRequestRef.current?.abort()
    const controller = new AbortController()
    activeRequestRef.current = controller

    setLastQuery(normalizedQuery)
    setIsSearching(true)
    setResults(null)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: normalizedQuery }),
        signal: controller.signal,
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      if (controller.signal.aborted) return
      setResults(data)
    } catch (error) {
      if (controller.signal.aborted) return
      toast.error('No se pudo completar la búsqueda')
    } finally {
      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null
      }
      if (!controller.signal.aborted) {
        setIsSearching(false)
      }
    }
  }, [])

  return (
    <AIContext.Provider value={{ results, isSearching, lastQuery, search, dismiss }}>
      {children}
    </AIContext.Provider>
  )
}
