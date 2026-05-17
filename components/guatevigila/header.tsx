'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { searchAction } from '@/lib/actions/search'
import type { SearchResult } from '@/lib/sdk/types'

interface NavItem {
  href: string
  label: string
}

const navItems: NavItem[] = [
  { href: '/', label: 'Alertas' },
  { href: '/entidades', label: 'Entidades' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/faq', label: 'Metodología' },
]

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  entity: 'Entidad',
  supplier: 'Proveedor',
  alert: 'Alerta',
}

const RISK_COLORS: Record<string, string> = {
  critical: 'text-destructive',
  high: 'text-destructive',
  medium: 'text-on-tertiary-fixed-variant',
  low: 'text-secondary',
}

const RISK_LABELS: Record<string, string> = {
  critical: 'Crítico',
  high: 'Alto',
  medium: 'Medio',
  low: 'Bajo',
}

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
}

function OmnisearchInput() {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [keyboardIndex, setKeyboardIndex] = useState(-1)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const runSearch = useDebouncedCallback((value: string) => {
    if (value.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    startTransition(async () => {
      const res = await searchAction(value)
      setResults(res)
      setOpen(res.length > 0)
      setKeyboardIndex(-1)
    })
  }, 300)

  const handleChange = (value: string) => {
    setQ(value)
    runSearch(value)
  }

  const navigate = (href: string) => {
    setOpen(false)
    setQ('')
    setResults([])
    router.push(href)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setKeyboardIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setKeyboardIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && keyboardIndex >= 0) {
      e.preventDefault()
      navigate(results[keyboardIndex].href)
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="flex-1 max-w-xl relative hidden md:block">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-lg pointer-events-none">
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={q}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="Buscar entidades, proveedores o alertas..."
        className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant focus:outline-none focus:border-primary text-sm rounded-sm"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant shadow-lg z-50 overflow-hidden rounded-sm">
          {results.map((result, i) => {
            const isKeyboard = i === keyboardIndex
            return (
              <button
                key={result.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); navigate(result.href) }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-outline-variant ${
                  isKeyboard ? 'not-hover:bg-surface-container-highest' : ''
                } ${i > 0 ? 'border-t border-outline-variant' : ''}`}
              >
                <span className="material-symbols-outlined text-lg shrink-0 text-outline">
                  {result.type === 'entity' ? 'account_balance' : result.type === 'supplier' ? 'storefront' : 'warning'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate text-on-surface">{result.name}</p>
                  <p className="text-xs truncate text-on-surface-variant">{result.secondary}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {result.riskLevel && (
                    <span className={`text-xs font-bold uppercase ${RISK_COLORS[result.riskLevel]}`}>
                      {RISK_LABELS[result.riskLevel]}
                    </span>
                  )}
                  <span className="text-[10px] font-semibold uppercase tracking-wide bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded-sm">
                    {TYPE_LABEL[result.type]}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Header({ showBackButton, backHref = '/' }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 h-16 w-full">
        <div className="flex items-center gap-5 justify-between px-4 md:px-16 w-full max-w-[1200px] mx-auto h-full">
          <div className="flex items-center gap-4 md:gap-8 flex-1">
            {showBackButton && (
              <Link
                href={backHref}
                className="hover:bg-surface-container-low p-1 rounded-sm transition-colors"
              >
                <span className="material-symbols-outlined text-on-surface">arrow_back</span>
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/guate-vigila-black.svg"
                alt="GuateVigila"
                width={28}
                height={28}
                priority
              />
              <span className="text-2xl font-bold tracking-tight text-on-surface">
                GuateVigila
              </span>
            </Link>
            <OmnisearchInput />
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-semibold tracking-wide uppercase transition-colors ${
                    isActive
                      ? 'text-primary border-b-2 border-primary pb-1'
                      : 'text-on-surface-variant hover:bg-surface-container-low px-2 py-1'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-sm hover:bg-surface-container-low transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span className="material-symbols-outlined text-on-surface">
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile drawer backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-surface border-l border-outline-variant flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-outline-variant">
          <span className="text-sm font-semibold text-on-surface">Navegación</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 rounded-sm hover:bg-surface-container-low transition-colors"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined text-on-surface">close</span>
          </button>
        </div>

        <nav className="flex flex-col px-4 py-6 gap-1">
          {navItems.map((item) => {
            const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto px-6 py-6 border-t border-outline-variant">
          <p className="text-[11px] text-on-surface-variant tracking-widest uppercase">
            GuateVigila © 2024
          </p>
        </div>
      </div>
    </>
  )
}
