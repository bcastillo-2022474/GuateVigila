'use client'

import Link from 'next/link'
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

  return (
    <header className="bg-surface border-b border-outline-variant sticky top-0 z-40 h-16 w-full">
      <div className="flex items-center justify-between px-4 md:px-16 w-full max-w-[1200px] mx-auto h-full">
        <div className="flex items-center gap-4 md:gap-8 flex-1">
          {showBackButton && (
            <Link
              href={backHref}
              className="hover:bg-surface-container-low p-1 rounded-sm transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface">
                arrow_back
              </span>
            </Link>
          )}
          <Link href="/">
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
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
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
      </div>
    </header>
  )
}
