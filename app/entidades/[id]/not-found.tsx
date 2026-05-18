import Link from 'next/link'
import { Header } from '@/components/guatevigila/header'

export default function EntityNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/entidades" />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-40 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-muted-foreground mb-6">
          domain_disabled
        </span>
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Entidad no encontrada
        </span>
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">
          Esta entidad no existe
        </h1>
        <p className="text-muted-foreground max-w-md mb-10">
          El identificador que buscás no corresponde a ninguna entidad en el registro. Puede que el enlace esté desactualizado.
        </p>
        <Link
          href="/entidades"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Ver todas las entidades
        </Link>
      </main>
    </div>
  )
}
