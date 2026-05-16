import Link from 'next/link'
import { Header } from '@/components/guatevigila'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-40 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6">
          search_off
        </span>
        <h1 className="text-5xl font-bold text-primary tracking-tight mb-4">404</h1>
        <p className="text-xl font-semibold text-on-surface mb-2">Página no encontrada</p>
        <p className="text-on-surface-variant max-w-md mb-10">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Volver al inicio
        </Link>
      </main>
    </div>
  )
}
