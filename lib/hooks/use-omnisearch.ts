'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { searchAction } from '@/lib/actions/search'
import type { SearchResult } from '@/lib/sdk/types'

export interface OmnisearchState {
  q: string
  results: SearchResult[]
  loading: boolean
  isOpen: boolean
  keyboardIndex: number
  setKeyboardIndex: React.Dispatch<React.SetStateAction<number>>
  onChange: (value: string) => void
  navigate: (href: string) => void
}

export function useOmnisearch(): OmnisearchState {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  const [, startTransition] = useTransition()

  const runSearch = useDebouncedCallback((value: string) => {
    if (value.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    startTransition(async () => {
      const res = await searchAction(value)
      setResults(res)
      setLoading(false)
      setKeyboardIndex(-1)
    })
  }, 300)

  const onChange = useCallback((value: string) => {
    setQ(value)
    setKeyboardIndex(-1)
    if (value.trim().length >= 2) {
      setLoading(true)
    } else {
      setResults([])
      setLoading(false)
    }
    runSearch(value)
  }, [runSearch])

  const navigate = useCallback((href: string) => {
    setQ('')
    setResults([])
    setLoading(false)
    setKeyboardIndex(-1)
    router.push(href)
  }, [router])

  return {
    q,
    results,
    loading,
    isOpen: q.trim().length >= 2,
    keyboardIndex,
    setKeyboardIndex,
    onChange,
    navigate,
  }
}
