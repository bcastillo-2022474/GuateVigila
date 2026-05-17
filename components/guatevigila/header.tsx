'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { OmnisearchInput } from './omnisearch-input'
import { MobileSearch } from './mobile-search'

const navItems = [
  { href: '/alertas', label: 'Alertas' },
  { href: '/entidades', label: 'Entidades' },
  { href: '/proveedores', label: 'Proveedores' },
  { href: '/faq', label: 'Metodología' },
  { href: '/', label: 'Home' },
]

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
}

export function Header({ showBackButton, backHref = '/' }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  useEffect(() => {
    document.body.style.overflow = menuOpen || searchOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen, searchOpen])

  return (
    <>
      <header className="bg-primary border-b border-primary/30 sticky top-0 z-40 h-16 w-full">
        <div className="flex items-center justify-between px-4 md:px-16 w-full max-w-[1200px] mx-auto h-full">

          <div className="flex items-center gap-3 md:gap-4">
            {showBackButton && (
              <Link href={backHref} className="hover:bg-primary/10 p-1 rounded-sm transition-colors">
                <span className="material-symbols-outlined text-primary-foreground">arrow_back</span>
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2">
              <Image src="/guate-vigila-black.svg" alt="GuateVigila" width={28} height={28} priority />
              <span className="text-2xl font-bold tracking-tight text-primary-foreground">GuateVigila</span>
            </Link>
          </div>

          <div className="hidden md:flex flex-1 justify-center px-8">
            <OmnisearchInput />
          </div>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-semibold tracking-wide uppercase transition-colors ${
                    isActive
                      ? 'text-primary-foreground border-b-2 border-primary-foreground pb-1'
                          : 'text-primary-foreground/90 hover:bg-primary/10 px-2 py-1'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-1 md:hidden">
            <button
              className="p-2 rounded-sm hover:bg-primary/10 transition-colors"
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <span className="material-symbols-outlined text-primary-foreground">search</span>
            </button>
            <button
              className="p-2 rounded-sm hover:bg-primary/10 transition-colors"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              <span className="material-symbols-outlined text-primary-foreground">
                {menuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>

        </div>
      </header>

      {searchOpen && <MobileSearch onClose={() => setSearchOpen(false)} />}

      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 md:hidden" onClick={() => setMenuOpen(false)} />
      )}

      <div className={`fixed top-0 right-0 z-50 h-full w-72 bg-primary border-l border-primary/30 flex flex-col transition-transform duration-300 ease-in-out md:hidden ${
        menuOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex items-center justify-between px-6 h-16 border-b border-primary/30">
          <span className="text-sm font-semibold text-primary-foreground">Navegación</span>
          <button
            onClick={() => setMenuOpen(false)}
            className="p-1 rounded-sm hover:bg-primary/10 transition-colors"
            aria-label="Cerrar menú"
          >
            <span className="material-symbols-outlined text-primary-foreground">close</span>
          </button>
        </div>

        <nav className="flex flex-col px-4 py-6 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-sm text-sm font-semibold tracking-wide uppercase transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary-foreground'
                    : 'text-primary-foreground/90 hover:bg-primary/10 hover:text-primary-foreground'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto px-6 py-6 border-t border-outline-variant">
          <p className="text-[11px] text-on-surface-variant tracking-widest uppercase">GuateVigila © 2024</p>
        </div>
      </div>
    </>
  )
}
