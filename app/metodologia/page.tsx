import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Shield, ArrowLeft, AlertTriangle, TrendingUp, FileText, FileX, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Metodología Técnica | GuateVigila',
  description: 'Cómo detectamos patrones de riesgo en la contratación pública guatemalteca. Señales, umbrales estadísticos y justificación analítica.',
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
    rationale: '1.5x el promedio nacional, sugiere barreras de entrada dirigidas',
  },
  {
    icon: TrendingUp,
    key: 'short_deadline',
    title: 'Plazos restrictivos', // Actualizado para concordar con la Home
    description: 'Procesos con ventana de recepción de ofertas tan corta que imposibilita la libre competencia.',
    threshold: '≥3 casos con <72h',
    national_avg: 'Minoría documentada',
    weight: 25,
    rationale: 'Patrón recurrente que beneficia a proveedores pre-avisados',
  },
  {
    icon: FileText,
    key: 'direct_purchase',
    title: 'Abuso de compra directa',
    description: 'Entidades que concentran su presupuesto en compras directas, evadiendo la licitación pública abierta.',
    threshold: '≥70% del presupuesto de la entidad',
    national_avg: '~31% del total nacional',
    weight: 20,
    rationale: 'Más del doble del comportamiento promedio institucional',
  },
  {
    icon: FileX,
    key: 'award_gap',
    title: 'Adjudicaciones sin contrato formal',
    description: 'Bases adjudicadas que carecen de registro de contrato en el sistema, lo que reduce la trazabilidad de los fondos.',
    threshold: '≥85% en ≥20 adjudicaciones',
    national_avg: '94% a nivel nacional',
    weight: 10,
    rationale: 'Se establece un umbral conservador debido a que es una anomalía sistémica del Estado',
  },
  {
    icon: XCircle,
    key: 'failed_tenders',
    title: 'Tasa atípica de concursos desiertos',
    description: 'Instituciones con una proporción irregular de concursos cancelados o declarados desiertos.',
    threshold: '≥50% en ≥20 concursos',
    national_avg: '~26% combinado',
    weight: 10,
    rationale: 'Representa el doble del promedio nacional, indicando mala planificación o manipulación de bases',
  },
]

export default function MetodologiaPage() {
  return (
    // Agregado el mismo degradado de la Home para dar consistencia visual
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
      {/* Header (Misma estructura que el Home pero con botón de retroceso) */}
      <header className="bg-primary border-b border-primary/30 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-primary-foreground/70 hover:text-primary-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="hidden sm:inline text-sm font-medium">Inicio</span>
            </Link>
            
            <div className="w-px h-6 bg-primary-foreground/20 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <Image 
                src="/guate-vigila-black.svg" 
                alt="GuateVigila" 
                width={28} 
                height={28} 
                priority 
                style={{ height: 'auto' }} 
              />
              <span className="text-lg font-bold tracking-tight text-primary-foreground">
                GuateVigila
              </span>
            </div>
          </div>
          <Button asChild size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/alertas">Explorar Panel</Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-16">
        <div className="mb-14 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
            Documentación Técnica
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-6 tracking-tight text-balance">
            Arquitectura Analítica y Metodología
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            GuateVigila detecta patrones estadísticamente anómalos en los datos de contratación pública. 
            Los umbrales no son arbitrarios: se derivan del análisis directo de los promedios nacionales observados en el dataset OCDS de Guatecompras.
          </p>
        </div>

        {/* Data Source */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center">1</div>
            Fuente de Datos Base
          </h2>
          <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm">
            <dl className="grid sm:grid-cols-3 gap-8 text-sm">
              <div>
                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider font-semibold">Estándar</dt>
                <dd className="font-medium text-foreground text-base">OCDS Guatecompras</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider font-semibold">Editor Original</dt>
                <dd className="font-medium text-foreground text-base">Ministerio de Finanzas</dd>
              </div>
              <div>
                <dt className="text-muted-foreground mb-2 text-xs uppercase tracking-wider font-semibold">Cobertura Temporal</dt>
                <dd className="font-medium text-foreground text-base">2020 - 2024</dd>
              </div>
            </dl>
            <div className="mt-8 pt-6 border-t border-border flex items-center">
              <Link 
                href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-accent hover:underline inline-flex items-center gap-2 font-medium"
              >
                Auditar repositorio oficial de Minfin <ArrowLeft className="h-4 w-4 rotate-135" />
              </Link>
            </div>
          </div>
        </section>

        {/* Score Calculation */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center">2</div>
            Algoritmo de Priorización (Score)
          </h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            Cada alerta institucional recibe una calificación de 0 a 100 basada en la sumatoria de las señales activas y sus pesos específicos. A mayor concentración de anomalías, mayor prioridad de auditoría:
          </p>
          <div className="p-6 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner">
            <code className="text-sm font-mono text-zinc-300">
              <span className="text-accent">const</span> risk_score = <span className="text-blue-400">Math</span>.<span className="text-yellow-300">min</span>(
              <span className="text-orange-400">100</span>, 
              Σ(weights[signal_activa])
              )
            </code>
          </div>
        </section>

        {/* Signals */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center">3</div>
            Matriz de Señales de Riesgo
          </h2>
          <div className="space-y-6">
            {signals.map((signal) => (
              <div 
                key={signal.key}
                className="p-6 md:p-8 rounded-xl border border-border bg-card hover:border-accent/30 transition-colors shadow-sm"
              >
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <div className="p-3 rounded-lg bg-accent/10 text-accent shrink-0">
                    <signal.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {signal.title}
                      </h3>
                      <span className="text-xs font-mono px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 font-bold">
                        Peso Asignado: {signal.weight}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      {signal.description}
                    </p>
                    
                    <div className="bg-secondary/30 rounded-lg p-5 border border-border/50">
                      <dl className="grid sm:grid-cols-3 gap-6 text-sm">
                        <div>
                          <dt className="text-muted-foreground mb-1.5 text-xs uppercase tracking-wider font-semibold">Umbral de Activación</dt>
                          <dd className="font-mono text-foreground text-sm bg-background inline-block px-2 py-1 rounded border border-border">{signal.threshold}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground mb-1.5 text-xs uppercase tracking-wider font-semibold">Contexto Nacional</dt>
                          <dd className="font-medium text-foreground">{signal.national_avg}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground mb-1.5 text-xs uppercase tracking-wider font-semibold">Justificación Técnica</dt>
                          <dd className="font-medium text-foreground">{signal.rationale}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Limitations */}
        <section className="mb-14">
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-accent/10 text-accent flex items-center justify-center">4</div>
            Limitaciones del Modelo
          </h2>
          <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm">
            <ul className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5">•</span>
                <span><strong>Carácter Investigativo:</strong> Las alertas identifican exclusivamente comportamientos estadísticos irregulares, no acusan ni prueban actos de corrupción de forma legal.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5">•</span>
                <span><strong>Calidad de Origen:</strong> El análisis depende netamente del estándar OCDS. Los datos pueden contener errores humanos heredados de la fuente original (fechas aberrantes o campos vacíos institucionales).</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="text-accent mt-0.5">•</span>
                <span><strong>Flexibilidad:</strong> Los umbrales algorítmicos son configurables en el código y pueden ajustarse mediante <i>Pull Requests</i> si el ecosistema nacional cambia.</span>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-10 border-t border-border">
          <Button asChild size="lg" className="px-8">
            <Link href="/alertas">
              Iniciar Exploración de Alertas
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer (Idéntico visualmente al de la Home) */}
      <footer className="border-t border-border py-12 bg-background/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-xs tracking-widest uppercase">
                GuateVigila © 2026
              </span>
            </div>
            
            <div className="flex gap-6 text-xs tracking-widest uppercase text-muted-foreground">
              <Link 
                href="https://datos.minfin.gob.gt/dataset"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                Datos Abiertos
              </Link>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Datos: OCDS Guatecompras (CC BY 4.0) · Licencia: MIT · 
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}