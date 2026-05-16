import type { Metadata } from 'next'
import { SITE, META } from '@/lib/constants/site'
import { Header } from '@/components/guatevigila'
import Link from 'next/link'

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
    icon: 'person',
    title: 'Proveedor único recurrente',
    threshold: '≥ 60% de contratos sin competencia, en ≥ 5 contratos',
    national: '~40% de concursos tienen un solo oferente',
    description:
      'Cuando una empresa gana la mayoría de contratos con una entidad siendo el único oferente, el Estado no está comprando en competencia real. El umbral es 1.5× el promedio nacional.',
  },
  {
    icon: 'timer_off',
    title: 'Licitación de plazo imposible',
    threshold: '≥ 3 procesos con ventana de oferta menor a 72 horas',
    national: 'Minoría documentada, no hay promedio oficial',
    description:
      'Está documentado en Guatemala que se publican licitaciones con apenas 1 hora de plazo. Solo puede ganar quien ya sabía que iba a salir. GuateVigila detecta cuando esto ocurre de forma recurrente con el mismo proveedor.',
  },
  {
    icon: 'receipt_long',
    title: 'Abuso de compra directa',
    threshold: '≥ 70% de adjudicaciones por compra directa, en ≥ 20 contratos',
    national: '~31% del total de contrataciones son compra directa',
    description:
      'La compra directa tiene menos controles y no requiere competencia. Una entidad que compra directamente más del doble del promedio nacional tiene un patrón que merece explicación.',
  },
  {
    icon: 'contract_delete',
    title: 'Gap adjudicación sin contrato',
    threshold: '≥ 85% de adjudicaciones que nunca formalizan contrato, en ≥ 20 awards',
    national: '94% a nivel nacional (anomalía sistémica del dataset)',
    description:
      'En 2024, Guatemala registró cientos de miles de adjudicaciones pero solo una fracción formalizó contrato. Por entidad, quienes adjudican sistemáticamente sin llegar a contrato representan un riesgo adicional.',
  },
  {
    icon: 'block',
    title: 'Tasa anómala de desiertos',
    threshold: '≥ 50% de concursos desiertos o cancelados, en ≥ 20 concursos',
    national: '~26% combinado (desiertos + cancelados)',
    description:
      'Un concurso desierto puede ser legítimo. Pero una entidad donde la mayoría de concursos quedan desiertos y luego compra directamente podría estar usando los concursos fallidos como pretexto para evitar licitación.',
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
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Qué es una alerta en GuateVigila?',
      acceptedAnswer: { '@type': 'Answer', text: 'Una alerta se genera cuando un par (entidad compradora, proveedor) supera el umbral estadístico en al menos una de las cinco señales de detección. No es una acusación — es el punto de partida de una investigación periodística.' },
    },
    {
      '@type': 'Question',
      name: '¿De dónde vienen los datos?',
      acceptedAnswer: { '@type': 'Answer', text: 'De Guatecompras, el sistema oficial de contrataciones públicas de Guatemala, publicados por el Ministerio de Finanzas en formato OCDS (Open Contracting Data Standard) bajo licencia CC BY 4.0.' },
    },
    {
      '@type': 'Question',
      name: '¿Qué es el score de riesgo?',
      acceptedAnswer: { '@type': 'Answer', text: 'Un número de 0 a 100 que refleja cuántas señales de riesgo coinciden simultáneamente en un par (entidad, proveedor) y qué tan lejos están del umbral estadístico nacional.' },
    },
    {
      '@type': 'Question',
      name: '¿GuateVigila acusa a alguien de corrupción?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. GuateVigila detecta patrones estadísticos, no delitos. La interpretación y conclusiones son responsabilidad del periodista o investigador.' },
    },
    {
      '@type': 'Question',
      name: '¿Necesito cuenta para usar GuateVigila?',
      acceptedAnswer: { '@type': 'Answer', text: 'No. Todo el contenido es público y accesible sin registro.' },
    },
  ],
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />

      <main className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 pt-20">
        {/* Header */}
        <section className="mb-16">
          <span className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant block mb-3">
            Metodología
          </span>
          <h1 className="text-5xl font-bold text-primary tracking-tight mb-4">
            Preguntas frecuentes
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Cómo funciona GuateVigila, qué es una alerta y cómo interpretarla.
          </p>
        </section>

        {/* What is an alert */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-on-surface mb-2">¿Qué es una alerta?</h2>
          <div className="w-12 h-0.5 bg-primary mb-6" />
          <div className="bg-surface-container-lowest border border-outline-variant p-8 max-w-3xl">
            <p className="text-on-surface leading-relaxed mb-4">
              Una alerta se genera cuando un par <strong>(entidad compradora, proveedor)</strong> supera
              el umbral estadístico en al menos una de las cinco señales de detección. El score de riesgo
              refleja cuántas señales coinciden simultáneamente.
            </p>
            <p className="text-on-surface leading-relaxed mb-4">
              Los umbrales no son arbitrarios — se derivan de los promedios nacionales observados en el
              dataset OCDS de Guatemala 2020–2024. Un par que supera el umbral tiene un comportamiento
              que difiere significativamente de cómo opera el resto del Estado.
            </p>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Una alerta <strong>no es una acusación</strong>. Es el punto de partida de una investigación.
            </p>
          </div>
        </section>

        {/* Signals */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Las cinco señales de detección</h2>
          <div className="w-12 h-0.5 bg-primary mb-6" />
          <div className="flex flex-col gap-4">
            {SIGNALS.map((signal, i) => (
              <div key={i} className="bg-surface-container-lowest border border-outline-variant p-6 flex gap-6">
                <div className="shrink-0 w-10 h-10 bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-surface-variant">{signal.icon}</span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-on-surface mb-1">{signal.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed mb-3">{signal.description}</p>
                  <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs">
                    <span>
                      <span className="font-semibold text-on-surface-variant uppercase tracking-wide">Umbral: </span>
                      <span className="text-on-surface">{signal.threshold}</span>
                    </span>
                    <span>
                      <span className="font-semibold text-on-surface-variant uppercase tracking-wide">Promedio nacional: </span>
                      <span className="text-on-surface">{signal.national}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Score */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Cómo se calcula el score de riesgo</h2>
          <div className="w-12 h-0.5 bg-primary mb-6" />
          <div className="bg-surface-container-lowest border border-outline-variant p-8 max-w-3xl">
            <p className="text-on-surface leading-relaxed mb-6">
              Cada señal tiene un peso base. El score final combina todas las señales activas,
              amplificadas según qué tan lejos está cada valor del umbral (máximo 2×):
            </p>
            <div className="border border-outline-variant overflow-hidden mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wide">Señal</th>
                    <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wide text-right">Peso base</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {[
                    ['Proveedor único recurrente', '35 pts'],
                    ['Licitación de plazo imposible', '25 pts'],
                    ['Abuso de compra directa', '20 pts'],
                    ['Gap adjudicación sin contrato', '10 pts'],
                    ['Tasa anómala de desiertos', '10 pts'],
                  ].map(([name, pts]) => (
                    <tr key={name}>
                      <td className="px-4 py-3 text-on-surface">{name}</td>
                      <td className="px-4 py-3 text-on-surface text-right font-mono">{pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-on-surface-variant text-sm">
              Score máximo: 100. Un score de 80+ indica múltiples señales simultáneas con valores muy por encima del umbral.
            </p>
          </div>
        </section>

        {/* General FAQs */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Otras preguntas</h2>
          <div className="w-12 h-0.5 bg-primary mb-6" />
          <div className="flex flex-col gap-0 border border-outline-variant divide-y divide-outline-variant max-w-3xl">
            {FAQS.map((faq, i) => (
              <div key={i} className="p-6">
                <p className="font-semibold text-on-surface mb-2">{faq.q}</p>
                <p className="text-on-surface-variant text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-base">notifications_active</span>
            Ver alertas activas
          </Link>
          <a
            href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-base">north_east</span>
            Datos fuente (MINFIN)
          </a>
        </section>
      </main>
    </div>
  )
}
