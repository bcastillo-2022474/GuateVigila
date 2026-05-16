'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

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

interface HeaderProps {
  showBackButton?: boolean
  backHref?: string
}

export function Header({ showBackButton, backHref = '/' }: HeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
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
            <div className="flex-1 max-w-xl relative hidden md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                search
              </span>
              <input
                type="text"
                placeholder="Buscar entidades, proveedores o alertas..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container-lowest border border-outline-variant focus:outline-none focus:border-primary text-sm rounded-sm"
              />
            </div>
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
