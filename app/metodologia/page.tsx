import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield, ArrowLeft, AlertTriangle, TrendingUp, FileText, FileX, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Metodología | GuateVigila',
  description: 'Cómo detectamos patrones de riesgo en la contratación pública guatemalteca. Señales, umbrales y justificación.',
}

const signals = [
  {
    icon: AlertTriangle,
    key: 'single_bidder',
    title: 'Proveedor único recurrente',
    description: 'Empresa que gana contratos siendo el único oferente de manera recurrente con una misma entidad.',
    threshold: '≥60% en ≥5 contratos',
    national_avg: '~40% de concursos con 1 oferente',
    weight: 35,
    rationale: '1.5x el promedio nacional, patrón estadístico anómalo',
  },
  {
    icon: TrendingUp,
    key: 'short_deadline',
    title: 'Licitaciones de plazo imposible',
    description: 'Procesos con ventana de oferta tan corta que dificulta la participación de competidores.',
    threshold: '≥3 casos con <72h',
    national_avg: 'Minoría documentada',
    weight: 25,
    rationale: 'Patrón recurrente, no incidente aislado',
  },
  {
    icon: FileText,
    key: 'direct_purchase',
    title: 'Abuso de compra directa',
    description: 'Entidades que usan compra directa en proporción muy superior al promedio nacional.',
    threshold: '≥70% en entidad',
    national_avg: '~31% del total',
    weight: 20,
    rationale: 'Más del doble del promedio nacional',
  },
  {
    icon: FileX,
    key: 'award_gap',
    title: 'Gap adjudicación sin contrato',
    description: 'Adjudicaciones que nunca generan contrato formal, posible señal de irregularidades.',
    threshold: '≥85% en ≥20 awards',
    national_avg: '94% a nivel nacional',
    weight: 10,
    rationale: 'Umbral alto por anomalía sistémica',
  },
  {
    icon: XCircle,
    key: 'failed_tenders',
    title: 'Tasa anómala de desiertos',
    description: 'Entidades con alta proporción de concursos que quedan desiertos o se cancelan.',
    threshold: '≥50% en ≥20 concursos',
    national_avg: '~26% combinado',
    weight: 10,
    rationale: 'El doble del promedio nacional',
  },
]

export default function MetodologiaPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Volver</span>
            </Link>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-accent" />
              <span className="font-semibold text-foreground tracking-tight">GuateVigila</span>
            </div>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/alertas">Ver Alertas</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Metodología
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            GuateVigila detecta patrones estadísticamente anómalos en los datos de contratación pública. 
            Los umbrales no son arbitrarios: se derivan de los promedios nacionales observados en el dataset OCDS de Guatecompras.
          </p>
        </div>

        {/* Data Source */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Fuente de datos</h2>
          <div className="p-6 rounded-lg border border-border bg-card">
            <dl className="grid sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground mb-1">Fuente</dt>
                <dd className="font-medium text-foreground">OCDS Guatecompras</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Publicado por</dt>
                <dd className="font-medium text-foreground">Ministerio de Finanzas de Guatemala</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-1">Cobertura</dt>
                <dd className="font-medium text-foreground">2020 - 2024</dd>
              </div>
            </dl>
            <div className="mt-4 pt-4 border-t border-border">
              <Link 
                href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline"
              >
                Acceder a los datos originales →
              </Link>
            </div>
          </div>
        </section>

        {/* Score Calculation */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Cálculo del score de riesgo</h2>
          <p className="text-muted-foreground mb-4">
            Cada alerta tiene un score de 0 a 100 basado en las señales activas y sus pesos:
          </p>
          <div className="p-4 rounded-lg bg-secondary/50 font-mono text-sm overflow-x-auto">
            <code>
              score = min(100, Σ weights[signal] para cada señal activa)
            </code>
          </div>
        </section>

        {/* Signals */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Señales de riesgo</h2>
          <div className="space-y-6">
            {signals.map((signal) => (
              <div 
                key={signal.key}
                className="p-6 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-md bg-accent/10 text-accent shrink-0">
                    <signal.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        {signal.title}
                      </h3>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                        Peso: {signal.weight}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {signal.description}
                    </p>
                    <dl className="grid sm:grid-cols-3 gap-4 text-sm">
                      <div>
                        <dt className="text-muted-foreground mb-1">Umbral</dt>
                        <dd className="font-medium text-foreground">{signal.threshold}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-1">Promedio nacional</dt>
                        <dd className="font-medium text-foreground">{signal.national_avg}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground mb-1">Justificación</dt>
                        <dd className="font-medium text-foreground">{signal.rationale}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Limitaciones</h2>
          <div className="p-6 rounded-lg border border-border bg-card">
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Las alertas identifican patrones estadísticos, no acusan ni prueban corrupción.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Los datos pueden contener errores de la fuente original (fechas aberrantes, campos vacíos).</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>Los umbrales son configurables y pueden ajustarse según el contexto.</span>
              </li>
              <li className="flex gap-2">
                <span className="text-accent">•</span>
                <span>El gap de adjudicación sin contrato es sistémico (~94% nacional), el umbral es conservador.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-border">
          <Button asChild size="lg">
            <Link href="/alertas">
              Explorar Alertas
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-12">
        <div className="max-w-4xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="tracking-widest uppercase">GuateVigila © 2024</span>
            </div>
            <div className="flex gap-6 tracking-widest uppercase">
              <Link 
                href="https://github.com/bcastillo-2022474/guate-vigila"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </Link>
              <Link 
                href="https://hacklatam.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                hack@latam
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
