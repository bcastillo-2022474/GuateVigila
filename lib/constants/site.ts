export const SITE = {
  name: 'GuateVigila',
  title: 'GuateVigila — Monitoreo de Contrataciones Públicas en Guatemala',
  description:
    'Plataforma de detección automática de patrones de riesgo en contratación pública guatemalteca. Analiza datos OCDS de Guatecompras para identificar anomalías estadísticas en entidades y proveedores.',
  url: 'https://guatevigila.gt',
  locale: 'es_GT',
}

export const META = {
  keywords: [
    'contratación pública Guatemala',
    'transparencia Guatemala',
    'Guatecompras análisis',
    'corrupción contratos Guatemala',
    'OCDS Guatemala',
    'periodismo de datos Guatemala',
    'vigilancia contratos públicos',
    'alertas corrupción',
    'proveedores estado Guatemala',
    'auditoría contratos Guatemala',
  ],
  ogImage: '/guate-vigila-black.png',
  icons: {
    svg: '/guate-vigila-black.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  pages: {
    alertas: {
      title: 'Cola de Alertas',
      description:
        'Alertas activas de riesgo en contrataciones públicas de Guatemala, ordenadas por score de riesgo. Detecta patrones de irregularidad en entidades y proveedores.',
      canonical: '/',
    },
    entidades: {
      title: 'Explorador de Entidades',
      description:
        'Directorio de entidades gubernamentales guatemaltecas bajo monitoreo. Analiza contratos, adjudicaciones y alertas activas por institución.',
      canonical: '/entidades',
    },
    proveedores: {
      title: 'Explorador de Proveedores',
      description:
        'Directorio de proveedores con contratos gubernamentales en Guatemala. Revisa historial, riesgo y alertas por empresa.',
      canonical: '/proveedores',
    },
    faq: {
      title: 'Metodología y Preguntas Frecuentes',
      description:
        'Cómo funciona GuateVigila: las cinco señales de detección, umbrales estadísticos y cómo interpretar una alerta de riesgo.',
      canonical: '/faq',
    },
  },
}

export const SOCIAL = {
  twitter: 'https://twitter.com/guatevigila',
  twitterHandle: '@guatevigila',
  github: 'https://github.com/bcastillo-2022474/guate-vigila',
}
