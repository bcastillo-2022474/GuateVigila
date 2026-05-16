import Link from 'next/link'
import { Header } from '@/components/guatevigila'

export default function AlertNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/" />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-40 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-6">
          notifications_off
        </span>
        <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant mb-3">
          Alerta no encontrada
        </span>
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">
          Esta alerta no existe
        </h1>
        <p className="text-on-surface-variant max-w-md mb-10">
          La alerta que buscás no existe o fue resuelta y removida del sistema. Revisá la cola de alertas activas.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Ver alertas activas
        </Link>
      </main>
    </div>
  )
}
