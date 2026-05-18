import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/guatevigila/header'
import { Button } from '@/components/ui/button'
import { SITE, META } from '@/lib/constants/site'
import { 
  AlertTriangle, 
  Clock, 
  FileText, 
  FileX, 
  XCircle, 
  ArrowRight, 
  ExternalLink 
} from 'lucide-react'

export const metadata: Metadata = {
  title: META.pages.faq.title,
  description: META.pages.faq.description,
  alternates: { canonical: META.pages.faq.canonical },
  openGraph: {
    title: `${META.pages.faq.title} | ${SITE.name}`,
    description: META.pages.faq.description,
    url: META.pages.faq.canonical,
  },
}

const SIGNALS = [
  {
    icon: AlertTriangle,
    title: 'Proveedor único recurrente',
    threshold: '≥ 60% de contratos sin competencia, en ≥ 5 contratos',
    national: '~40% de concursos tienen un solo oferente',
    description:
      'Cuando una empresa gana la mayoría de contratos con una entidad siendo el único oferente, el Estado no está comprando en competencia real. El umbral es 1.5× el promedio nacional.',
  },
  {
    icon: Clock,
    title: 'Licitación de plazo restrictivo',
    threshold: '≥ 3 procesos con ventana de oferta menor a 72 horas',
    national: 'Minoría documentada, no hay promedio oficial',
    description:
      'Está documentado en Guatemala que se publican licitaciones con apenas 1 hora de plazo. Solo puede ganar quien ya sabía que iba a salir. GuateVigila detecta cuando esto ocurre de forma recurrente.',
  },
  {
    icon: FileText,
    title: 'Abuso de compra directa',
    threshold: '≥ 70% de adjudicaciones por compra directa, en ≥ 20 contratos',
    national: '~31% del total de contrataciones son compra directa',
    description:
      'La compra directa tiene menos controles y no requiere competencia. Una entidad que compra directamente más del doble del promedio nacional tiene un patrón que merece explicación.',
  },
  {
    icon: FileX,
    title: 'Gap adjudicación sin contrato',
    threshold: '≥ 85% de adjudicaciones que nunca formalizan contrato, en ≥ 20 awards',
    national: '94% a nivel nacional (anomalía sistémica del dataset)',
    description:
      'En 2024, Guatemala registró cientos de miles de adjudicaciones pero solo una fracción formalizó contrato. Quienes adjudican sistemáticamente sin llegar a contrato representan un riesgo adicional.',
  },
  {
    icon: XCircle,
    title: 'Tasa anómala de desiertos',
    threshold: '≥ 50% de concursos desiertos o cancelados, en ≥ 20 concursos',
    national: '~26% combinado (desiertos + cancelados)',
    description:
      'Un concurso desierto puede ser legítimo. Pero una entidad donde la mayoría de concursos quedan desiertos y luego compra directamente podría estar usando los concursos fallidos como pretexto.',
  },
]

const FAQS = [
  {
    q: '¿GuateVigila acusa a alguien de corrupción?',
    a: 'No. GuateVigila detecta patrones estadísticos, no delitos. Una alerta significa que el comportamiento de una entidad o proveedor difiere significativamente del promedio nacional y merece investigación. La interpretación y conclusiones son responsabilidad del periodista o investigador.',
  },
  {
    q: '¿De dónde vienen los datos?',
    a: 'De Guatecompras, el sistema oficial de contrataciones públicas de Guatemala, publicados por el Ministerio de Finanzas en formato OCDS (Open Contracting Data Standard) bajo licencia CC BY 4.0. Todos los contratos mostrados tienen link directo al registro original.',
  },
  {
    q: '¿Qué es el score de riesgo?',
    a: 'Un número de 0 a 100 que refleja cuántas señales de riesgo coinciden simultáneamente en un par (entidad, proveedor) y qué tan lejos están del umbral. Más señales y mayor desviación del promedio = score más alto. No es un índice de culpabilidad.',
  },
  {
    q: '¿Con qué frecuencia se actualizan los datos?',
    a: 'Actualmente el dataset es estático (2024). La arquitectura está diseñada para actualizaciones periódicas — cada vez que el MINFIN publique nuevos datos OCDS, el pipeline puede re-procesarlos.',
  },
  {
    q: '¿Necesito cuenta para usar GuateVigila?',
    a: 'No. Todo el contenido es público y accesible sin registro.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.q,
    acceptedAnswer: { '@type': 'Answer', text: faq.a },
  })),
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <main className="max-w-4xl mx-auto px-4 md:px-8 py-16 pt-20">
        
        {/* Encabezado Principal */}
        <section className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium mb-4">
            Base de Conocimiento
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-4 text-balance">
            Preguntas Frecuentes
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            Cómo funciona GuateVigila, qué significa estadísticamente una alerta y cómo interpretar los datos para una fiscalización ciudadana.
          </p>
        </section>

        {/* ¿Qué es una alerta? */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">¿Qué es una alerta?</h2>
          <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-foreground leading-relaxed mb-4">
              Una alerta se genera cuando un par <strong>(entidad compradora, proveedor)</strong> supera
              el umbral estadístico en al menos una de las cinco señales de detección. El score de riesgo
              refleja cuántas señales coinciden simultáneamente.
            </p>
            <p className="text-foreground leading-relaxed mb-4">
              Los umbrales no son arbitrarios — se derivan de los promedios nacionales observados en el
              dataset OCDS de Guatemala 2020–2024. Un par que supera el umbral tiene un comportamiento
              que difiere significativamente de cómo opera el resto del Estado.
            </p>
            <div className="mt-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-accent text-sm font-medium">
                Una alerta <strong>no es una acusación de corrupción</strong>. Es únicamente el punto de partida técnico para una investigación periodística.
              </p>
            </div>
          </div>
        </section>

        {/* Las Señales */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Las cinco señales de detección</h2>
          <div className="space-y-6">
            {SIGNALS.map((signal, i) => (
              <div key={i} className="p-6 rounded-xl border border-border bg-card shadow-sm hover:border-accent/30 transition-colors">
                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
                    <signal.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">{signal.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {signal.description}
                    </p>
                    
                    <div className="bg-secondary/30 rounded-md p-4 border border-border/50">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <span className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                            Umbral de Activación
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {signal.threshold}
                          </span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">
                            Promedio Nacional
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {signal.national}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* El Score de Riesgo */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Cálculo del Score de Riesgo</h2>
          <div className="p-6 md:p-8 rounded-xl border border-border bg-card shadow-sm">
            <p className="text-foreground leading-relaxed mb-6">
              Cada señal tiene un peso base asignado. El score final combina todas las señales activas,
              amplificadas según qué tan lejos está cada valor de su umbral:
            </p>
            
            <div className="rounded-lg border border-border overflow-hidden mb-6">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide">Identificador de Señal</th>
                    <th className="px-5 py-3 font-semibold text-muted-foreground text-xs uppercase tracking-wide text-right">Peso Base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    ['Proveedor único recurrente', '35 pts'],
                    ['Licitación de plazo restrictivo', '25 pts'],
                    ['Abuso de compra directa', '20 pts'],
                    ['Gap adjudicación sin contrato', '10 pts'],
                    ['Tasa anómala de desiertos', '10 pts'],
                  ].map(([name, pts]) => (
                    <tr key={name} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-4 text-foreground font-medium">{name}</td>
                      <td className="px-5 py-4 text-accent text-right font-mono font-bold">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground text-sm">
              <strong className="text-foreground">Score máximo: 100.</strong> Un score superior a 80 indica múltiples señales simultáneas activadas con valores muy por encima del umbral seguro.
            </p>
          </div>
        </section>

        {/* FAQs Adicionales */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Preguntas Generales</h2>
          <div className="border border-border rounded-xl bg-card divide-y divide-border overflow-hidden shadow-sm">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-6 md:p-8 hover:bg-secondary/5 transition-colors">
                <h3 className="text-lg font-bold text-foreground mb-3">{faq.q}</h3>
                <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section Final */}
        <section className="flex flex-col sm:flex-row items-center gap-4 pt-8 border-t border-border">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/alertas">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Ver panel de alertas activas
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <a
              href="https://datos.minfin.gob.gt/dataset"
              target="_blank"
              rel="noopener noreferrer"
            >
              Auditar datos fuente (MINFIN)
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </section>

      </main>
    </div>
  )
}