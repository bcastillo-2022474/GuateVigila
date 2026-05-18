'use client'

import { useEffect } from 'react'
import { Header } from '@/components/guatevigila/header'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-40 flex flex-col items-center text-center">
        <span className="material-symbols-outlined text-6xl text-destructive mb-6">
          error
        </span>
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
          Algo salió mal
        </h1>
        <p className="text-muted-foreground max-w-md mb-10">
          Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Intentar de nuevo
          </button>
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Volver al inicio
          </a>
        </div>
        {error.digest && (
          <p className="mt-8 text-xs text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
      </main>
    </div>
  )
}
