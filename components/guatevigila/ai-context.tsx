'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
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
  const [results, setResults] = useState<AISearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [lastQuery, setLastQuery] = useState('')

  const search = useCallback(async (query: string) => {
    if (!query?.trim()) return

    setLastQuery(query)
    setIsSearching(true)
    setResults(null)

    try {
      const response = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) throw new Error('Search failed')

      const data = await response.json()
      setResults(data)
    } catch (error) {
      toast.error('No se pudo completar la búsqueda')
    } finally {
      setIsSearching(false)
    }
  }, [])

  const dismiss = useCallback(() => {
    setResults(null)
    setLastQuery('')
  }, [])

  return (
    <AIContext.Provider value={{ results, isSearching, lastQuery, search, dismiss }}>
      {children}
    </AIContext.Provider>
  )
}
