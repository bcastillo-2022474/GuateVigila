'use client'

import type { RiskLevel } from '@/lib/sdk/types'
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  FileX, 
  XCircle, 
  HelpCircle,
  Network
} from 'lucide-react'

interface Metric {
  label: string
  value: string | number
}

interface Signal {
  id: string
  title: string
  description: string
  icon: string
  metrics: Metric[]
}

interface AlertData {
  id: string
  entityName: string
  riskLevel: RiskLevel
  riskScore: number
  involvedSupplier: {
    id: string
    name: string
    nit: string
    totalAwarded: number
    year: number
  }
  signals: Signal[]
}

type AlertEvidenceGraphProps = {
  alert: AlertData
}

function getSeverityColors(severity: RiskLevel) {
  switch (severity) {
    case 'critical':
    case 'high':
      return { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' }
    case 'medium':
      return { text: 'text-amber-600', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
    default:
      return { text: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30' }
  }
}

function getSignalIcon(iconName: string) {
  const mapping: Record<string, any> = {
    person: AlertTriangle,
    timer_off: Clock,
    receipt_long: FileText,
    contract_delete: FileX,
    block: XCircle,
  }
  return mapping[iconName] || HelpCircle
}

export function AlertEvidenceGraph({ alert }: AlertEvidenceGraphProps) {
  const colors = getSeverityColors(alert.riskLevel)

  return (
    // Contenedor padre con scroll horizontal limpio
    <div className="w-full bg-card/40 border border-border rounded-2xl p-6 md:p-8 shadow-inner relative overflow-x-auto scrollbar-thin">
      {/* Fondo de cuadrícula técnica OSINT */}
      <div className="absolute inset-0 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] bg-[size:20px_20px] opacity-40 pointer-events-none" />

      {/* CORRECCIÓN CRUCIAL: w-max evita la compresión de los hijos, 
        min-w-full asegura el llenado en pantallas grandes y pr-12 evita el choque contra el borde derecho.
      */}
      <div className="relative flex items-start gap-16 py-4 z-10 w-max min-w-full pr-12">
        
        {/* COLUMNA IZQUIERDA: TORRE DE CONTROL DEL CASO */}
        <div className="flex flex-col gap-4 w-[280px] shrink-0">
          
          {/* Bloque de Score */}
          <div className="bg-background border border-border p-4 rounded-xl shadow-sm text-center relative">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">
              Score de Riesgo
            </span>
            <div className={`text-4xl font-mono font-bold ${colors.text}`}>{alert.riskScore}</div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md mt-2 inline-block border ${colors.bg} ${colors.border}`}>
              {alert.riskLevel.toUpperCase()}
            </span>
          </div>

          {/* Bloque de Implicados Unificados */}
          <div className="bg-background border border-border p-5 rounded-xl shadow-sm space-y-4">
            <div>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Actor Comprador
              </span>
              <p className="text-xs font-bold text-foreground leading-tight">{alert.entityName}</p>
            </div>
            
            <div className="border-t border-border/60 pt-3">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Proveedor Adjudicado
              </span>
              <p className="text-xs font-bold text-accent leading-tight">{alert.involvedSupplier.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-1">NIT: {alert.involvedSupplier.nit}</p>
            </div>

            <div className="border-t border-border/60 pt-3 bg-secondary/20 -mx-5 -mb-5 p-4 rounded-b-xl">
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-0.5">
                Volumen Adjudicado ({alert.involvedSupplier.year})
              </span>
              <p className="text-sm font-mono font-bold text-foreground">
                Q {alert.involvedSupplier.totalAwarded.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>

        {/* CONTENEDOR DE LÍNEAS VECTORIALES (CANVAS) */}
        <div className="absolute left-[280px] top-0 bottom-0 w-16 hidden lg:block pointer-events-none">
          <svg className="w-full h-full text-border/80" xmlns="http://www.w3.org/2000/svg">
            {alert.signals.map((_, index) => {
              const total = alert.signals.length
              const startY = 180 
              const endY = 40 + (index * (560 / total))
              return (
                <path
                  key={index}
                  d={`M 0,${startY} C 32,${startY} 32,${endY} 64,${endY}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="transition-all duration-300"
                />
              )
            })}
          </svg>
        </div>

        {/* COLUMNAS DE SEÑALES Y EVIDENCIAS COMPILADAS */}
        <div className="flex flex-1 gap-6 justify-start">
          {alert.signals.map((signal) => {
            const IconComponent = getSignalIcon(signal.icon)
            return (
              <div key={signal.id} className="flex flex-col gap-3 w-[230px] shrink-0">
                
                {/* Cabecera de la Señal */}
                <div className="bg-background border-2 border-border p-4 rounded-xl shadow-sm relative min-h-[115px] flex flex-col justify-between hover:border-accent/40 transition-colors group">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-foreground tracking-tight leading-snug group-hover:text-accent transition-colors">
                      {signal.title}
                    </p>
                    <div className={`p-1.5 rounded-md shrink-0 ${colors.bg} ${colors.text}`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider mt-2 block leading-normal">
                    {signal.description}
                  </span>
                </div>

                {/* Línea conectora vertical interna */}
                <div className="w-px h-3 bg-border/60 self-center" />

                {/* Bloques de Evidencia Pautados en Cascada */}
                <div className="flex flex-col gap-2 relative">
                  {signal.metrics.map((metric, mIdx) => (
                    <div key={mIdx} className="w-full">
                      {/* Agregado break-words y whitespace-normal para evitar truncamiento por CSS */}
                      <div className="bg-card border border-border/70 p-3 rounded-lg shadow-sm text-center whitespace-normal break-words">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block mb-1 leading-tight">
                          {metric.label}
                        </span>
                        <span className="text-xs font-mono font-bold text-foreground block mt-0.5">
                          {typeof metric.value === 'number' ? metric.value.toLocaleString('es-GT') : metric.value}
                        </span>
                      </div>
                      {mIdx < signal.metrics.length - 1 && (
                        <div className="w-px h-2 bg-border/40 mx-auto" />
                      )}
                    </div>
                  ))}
                </div>

              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}