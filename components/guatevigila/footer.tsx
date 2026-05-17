import Link from 'next/link'

export function Footer() {
  return (
    <footer className="max-w-[1200px] mx-auto px-4 md:px-16 py-12 border-t border-border mt-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <span className="text-xs tracking-wider uppercase text-muted-foreground">
          GuateVigila 2024
        </span>

        <div className="flex gap-6">
          <Link
            href="/metodologia"
            className="text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Metodología
          </Link>

          <a
            href="https://datos.minfin.gob.gt/dataset/ocds-guatecompras"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Datos Abiertos
          </a>

          <a
            href="https://github.com/guatevigila"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}
