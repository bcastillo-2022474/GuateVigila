'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Shield, Search, FileText, AlertTriangle, TrendingUp, Network, Building2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'

const signals = [
  {
    icon: AlertTriangle,
    title: 'Proveedor único recurrente',
    description: 'Empresas que ganan el 60% o más de sus contratos siendo el único oferente.',
    threshold: '≥60%',
  },
  {
    icon: TrendingUp,
    title: 'Plazos restrictivos',
    description: 'Procesos competitivos con una ventana de ofertas menor a 72 horas.',
    threshold: '<72h',
  },
  {
    icon: FileText,
    title: 'Abuso de compra directa',
    description: 'Entidades donde más del 70% de los fondos evitan la licitación abierta.',
    threshold: '>70%',
  },
]

// DATA REALÍSTICA DE VISTA PREVIA (Espejo de tu Base de Datos)
const graphPreviewData = {
  entity: {
    title: 'Ministerio de Comunicaciones (CIV)',
    category: 'Entidad Compradora',
    risk: 'Crítico (85/100)',
    riskClass: 'text-red-500 bg-red-500/10 border-red-500/20',
    description: 'Concentración inusual de contratos bajo modalidades de excepción en infraestructura.',
    statLabel: 'Monto Auditado',
    statValue: 'Q 412.8M',
    contracts: '42 Adjudicaciones'
  },
  supplier: {
    title: 'Asfaltos de Guatemala, S.A.',
    category: 'Contratista Vinculado',
    risk: 'Alto Riesgo',
    riskClass: 'text-orange-500 bg-orange-500/10 border-orange-500/20',
    description: 'Ganador recurrente del 74% de concursos de la entidad operando como único oferente.',
    statLabel: 'Total Adjudicado',
    statValue: 'Q 284.1M',
    contracts: '18 Contratos'
  },
  signal1: {
    title: 'Plazos Restrictivos Detectados',
    category: 'Métrica de Señal',
    risk: 'Peso: 25 Pts',
    riskClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    description: 'Concursos publicados de emergencia con menos de 48 horas para recepción de ofertas.',
    statLabel: 'Desviación Estándar',
    statValue: '8.4x más rápido',
    contracts: '5 Concursos'
  },
  signal2: {
    title: 'Fraccionamiento de Compra Directa',
    category: 'Métrica de Señal',
    risk: 'Peso: 20 Pts',
    riskClass: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    description: 'Evasión de licitaciones abiertas dividiendo montos mayores en compras de baja cuantía.',
    statLabel: 'Porcentaje de Presupuesto',
    statValue: '71.4% Directo',
    contracts: '24 Operaciones'
  }
}

type NodeKey = keyof typeof graphPreviewData;

export default function HomePage() {
  // Estado para controlar qué nodo del grafo se está inspeccionando
  const [activeNode, setActiveNode] = useState<NodeKey>('entity')
  const currentData = graphPreviewData[activeNode]

  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-primary border-b border-primary/30 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/guate-vigila-black.svg" alt="GuateVigila" width={28} height={28} priority style={{ height: 'auto' }} />
            <span className="text-lg font-bold tracking-tight text-primary-foreground">GuateVigila</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-primary-foreground/90">
            <Link href="/metodologia" className="hover:text-primary-foreground transition-colors">
              Metodología
            </Link>
            <Link 
              href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-foreground transition-colors"
            >
              Datos Abiertos
            </Link>
          </nav>
          <Button asChild size="sm">
            <Link href="/alertas" className="text-primary-foreground">
              Ver Alertas
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 md:py-32">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Auditoría de Datos OCDS Guatecompras
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance leading-[1.1] mb-6">
              Detección y monitoreo de riesgos en la contratación pública
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Identificamos de forma automática patrones atípicos y anomalías en las compras del Estado guatemalteco. Una plataforma abierta de fiscalización para el periodismo, la sociedad civil y la transparencia.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="text-base">
                <Link href="/alertas">
                  Explorar Alertas
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="/metodologia">
                  Ver Metodología Técnica
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA DE GRAFOS CON VISTA PREVIA DE DATA REAL */}
      <section className="border-y border-border bg-secondary/30 py-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="mb-10 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent text-xs font-semibold mb-3">
              <Network className="h-3.5 w-3.5" /> Explorador Relacional de Casos
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              Mapeo de Redes de Influencia y Nexos Atípicos
            </h2>
            <p className="text-sm text-muted-foreground max-w-2xl mt-1">
              Prueba el funcionamiento de nuestro motor interactivo. Haz clic en los diferentes nodos del grafo de ejemplo para inspeccionar las métricas cruzadas que estructuran una alerta institucional.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-8 items-stretch">
            
            {/* LADO IZQUIERDO: EL GRAFO INTERACTIVO ANCHO */}
            <div className="md:col-span-7 flex justify-center items-center relative min-h-[340px] bg-card border border-border rounded-2xl p-6 shadow-inner overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:20px_20px]" />
              
              <div className="relative w-full max-w-md h-64 flex items-center justify-center">
                
                {/* SVG de Conexiones Dinámicas según Selección */}
                <svg className="absolute inset-0 w-full h-full text-border" xmlns="http://www.w3.org/2000/svg">
                  <line x1="50%" y1="50%" x2="20%" y2="25%" stroke={activeNode === 'supplier' ? '#b91c1c' : 'currentColor'} strokeWidth={activeNode === 'supplier' ? '2.5' : '1.5'} className="transition-all duration-300" />
                  <line x1="50%" y1="50%" x2="80%" y2="25%" stroke={activeNode === 'signal1' ? '#b91c1c' : 'currentColor'} strokeWidth={activeNode === 'signal1' ? '2.5' : '1.5'} className="transition-all duration-300" />
                  <line x1="50%" y1="50%" x2="50%" y2="80%" stroke={activeNode === 'signal2' ? '#b91c1c' : 'currentColor'} strokeWidth={activeNode === 'signal2' ? '2.5' : '1.5'} className="transition-all duration-300" />
                </svg>

                {/* NODO CENTRAL: Entidad Compradora */}
                <button 
                  onClick={() => setActiveNode('entity')}
                  className={`absolute z-10 p-4 rounded-full shadow-xl border-2 transition-all duration-300 ${
                    activeNode === 'entity' 
                      ? 'bg-zinc-900 border-accent text-accent scale-110 ring-4 ring-accent/10' 
                      : 'bg-zinc-900 border-primary text-primary-foreground hover:border-accent'
                  }`}
                >
                  <Shield className="h-7 w-7" />
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold tracking-tight text-muted-foreground whitespace-nowrap bg-background px-1.5 border rounded">
                    CIV (Entidad)
                  </span>
                </button>

                {/* NODO SATÉLITE: Contratista */}
                <button 
                  onClick={() => setActiveNode('supplier')}
                  className={`absolute top-[12%] left-[10%] z-10 p-3 rounded-full shadow-md border transition-all duration-300 ${
                    activeNode === 'supplier' 
                      ? 'bg-zinc-900 border-accent text-accent scale-110 ring-4 ring-accent/10' 
                      : 'bg-card border-border text-muted-foreground hover:border-accent hover:text-foreground'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground whitespace-nowrap bg-background px-1.5 border rounded">
                    Contratista
                  </span>
                </button>

                {/* NODO SATÉLITE: Señal 1 */}
                <button 
                  onClick={() => setActiveNode('signal1')}
                  className={`absolute top-[12%] right-[10%] z-10 p-3 rounded-full shadow-md border transition-all duration-300 ${
                    activeNode === 'signal1' 
                      ? 'bg-zinc-900 border-accent text-accent scale-110 ring-4 ring-accent/10' 
                      : 'bg-card border-border text-muted-foreground hover:border-accent hover:text-foreground'
                  }`}
                >
                  <TrendingUp className="h-5 w-5" />
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground whitespace-nowrap bg-background px-1.5 border rounded">
                    Señal: Plazos
                  </span>
                </button>

                {/* NODO SATÉLITE: Señal 2 */}
                <button 
                  onClick={() => setActiveNode('signal2')}
                  className={`absolute bottom-[8%] left-[43%] z-10 p-3 rounded-full shadow-md border transition-all duration-300 ${
                    activeNode === 'signal2' 
                      ? 'bg-zinc-900 border-accent text-accent scale-110 ring-4 ring-accent/10' 
                      : 'bg-card border-border text-muted-foreground hover:border-accent hover:text-foreground'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-[10px] font-mono text-muted-foreground whitespace-nowrap bg-background px-1.5 border rounded">
                    Señal: Compras
                  </span>
                </button>

              </div>
            </div>

            {/* LADO DERECHO: INSPECTOR DE DATA EN TIEMPO REAL */}
            <div className="md:col-span-5 flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm relative">
              <div className="absolute top-4 right-4 flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                <Eye className="h-3 w-3" /> Data Inspector
              </div>

              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground block mb-1">
                  {currentData.category}
                </span>
                <h3 className="text-xl font-bold text-foreground tracking-tight mb-2">
                  {currentData.title}
                </h3>
                
                <div className="mb-4">
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded border ${currentData.riskClass}`}>
                    {currentData.risk}
                  </span>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {currentData.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4 mt-6">
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold block">{currentData.statLabel}</span>
                  <span className="text-lg font-bold text-foreground font-mono">{currentData.statValue}</span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold block">Volumen Bajo Análisis</span>
                  <span className="text-sm font-semibold text-foreground block mt-1">{currentData.contracts}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Signals Section */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
              Patrones analizados en la plataforma
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada alerta calcula un índice de riesgo (0-100) combinando múltiples variables estadísticas calculadas a partir del comportamiento histórico nacional.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {signals.map((signal) => (
              <div 
                key={signal.title}
                className="group p-6 rounded-lg border border-border bg-card hover:border-accent/50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-md bg-accent/10 text-accent">
                    <signal.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {signal.threshold}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-accent transition-colors">
                  {signal.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {signal.description}
                </p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link 
              href="/metodologia" 
              className="text-sm text-accent hover:underline inline-flex items-center gap-1"
            >
              Conocer todos los umbrales de riesgo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-24 bg-secondary/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Arquitectura del análisis
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Ingesta de datos</h3>
              <p className="text-sm text-muted-foreground">
                Sincronizamos y estructuramos las publicaciones bajo el estándar internacional OCDS emitidas por el Ministerio de Finanzas.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Procesamiento algorítmico</h3>
              <p className="text-sm text-muted-foreground">
                Evaluamos matemáticamente cada adjudicación, contrastando desviaciones presupuestarias o de tiempos con el promedio histórico.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Clasificación de alertas</h3>
              <p className="text-sm text-muted-foreground">
                Disparamos un índice de prioridad visual indexando documentación de origen y herramientas para la descarga de informes periciales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8 text-center">
          <Search className="h-10 w-10 text-accent mx-auto mb-6" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
            Inicia una fiscalización
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Filtra las alertas críticas en tiempo real, rastrea el comportamiento de proveedores específicos y descarga reportes con resúmenes ejecutivos automatizados.
          </p>
          <Button asChild size="lg">
            <Link href="/alertas">
              Explorar Panel de Alertas
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="h-5 w-5" />
              <span className="text-xs tracking-widest uppercase">
                GuateVigila © 2026
              </span>
            </div>
            
            <div className="flex gap-6 text-xs tracking-widest uppercase text-muted-foreground">
              <Link href="/metodologia" className="hover:text-foreground transition-colors">
                Metodología
              </Link>
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