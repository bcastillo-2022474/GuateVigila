import Link from 'next/link'
import { Header } from '@/components/guatevigila/header'

export default function SupplierNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header showBackButton backHref="/proveedores" />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-40 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-muted-foreground mb-6">
          person_off
        </span>
        <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-3">
          Proveedor no encontrado
        </span>
        <h1 className="text-4xl font-bold text-primary tracking-tight mb-3">
          Este proveedor no existe
        </h1>
        <p className="text-muted-foreground max-w-md mb-10">
          El NIT o identificador que buscás no corresponde a ningún proveedor en el registro. Puede que el enlace esté desactualizado.
        </p>
        <Link
          href="/proveedores"
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span>
          Ver todos los proveedores
        </Link>
      </main>
    </div>
  )
}
