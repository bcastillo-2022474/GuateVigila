import Link from 'next/link'
import { ArrowRight, Shield, Search, FileText, AlertTriangle, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

const signals = [
  {
    icon: AlertTriangle,
    title: 'Proveedor único recurrente',
    description: 'Empresas que ganan ≥60% de contratos siendo único oferente',
    threshold: '60%',
  },
  {
    icon: TrendingUp,
    title: 'Plazos imposibles',
    description: 'Procesos con ventana de oferta menor a 72 horas',
    threshold: '<72h',
  },
  {
    icon: FileText,
    title: 'Abuso de compra directa',
    description: 'Entidades donde >70% evitan licitación abierta',
    threshold: '70%',
  },
]

const stats = [
  { value: '5', label: 'Señales de riesgo' },
  { value: '2020-2024', label: 'Años de datos' },
  { value: 'OCDS', label: 'Estándar abierto' },
  { value: '100%', label: 'Datos públicos' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-accent/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-black border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-white" />
            <span className="font-semibold text-white tracking-tight">GuateVigila</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/90">
            <Link href="/metodologia" className="hover:text-white transition-colors">
              Metodología
            </Link>
            <Link 
              href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras" 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Datos Abiertos
            </Link>
          </nav>
          <Button asChild size="sm">
            <Link href="/alertas" className="text-white">
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
              Datos OCDS Guatecompras 2020-2024
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-balance leading-[1.1] mb-6">
              Vigilancia ciudadana de contratación pública
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-8 max-w-2xl">
              Detectamos automáticamente patrones de riesgo en las compras del Estado guatemalteco. 
              Herramienta abierta para periodistas, ciudadanos y organizaciones de transparencia.
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
                  Conocer Metodología
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-border bg-secondary/50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signals Section */}
      <section className="py-20 md:py-24">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-balance">
              Señales de riesgo que detectamos
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Cada combinación de señales genera una alerta con score de riesgo 0-100, 
              basado en umbrales derivados de promedios nacionales.
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
              Ver todas las señales y umbrales
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
              Cómo funciona
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground mb-2">Datos abiertos</h3>
              <p className="text-sm text-muted-foreground">
                Procesamos los datos OCDS de Guatecompras publicados por el Ministerio de Finanzas
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground mb-2">Análisis automático</h3>
              <p className="text-sm text-muted-foreground">
                Queries SQL detectan patrones estadísticos anómalos comparados con promedios nacionales
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground mb-2">Alertas priorizadas</h3>
              <p className="text-sm text-muted-foreground">
                Cada alerta incluye score de riesgo, links a fuentes oficiales y contexto periodístico
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
            Empieza a investigar
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Explora las alertas activas, busca por entidad o proveedor, 
            y descubre patrones en la contratación pública guatemalteca.
          </p>
          <Button asChild size="lg">
            <Link href="/alertas">
              Ver Cola de Alertas
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
                GuateVigila © 2024
              </span>
            </div>
            
            <div className="flex gap-6 text-xs tracking-widest uppercase text-muted-foreground">
              <Link href="/metodologia" className="hover:text-foreground transition-colors">
                Metodología
              </Link>
              <Link 
                href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras"
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
              Datos: OCDS Guatecompras (CC BY 4.0) · Código: MIT License · 
              Construido para{' '}
              <Link 
                href="https://hacklatam.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                hack@latam
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
