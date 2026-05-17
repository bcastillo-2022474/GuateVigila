# GuateVigila — Context

> Hackathon: hack@latam · Track: Transparency & Corruption · Equipo: 4 personas, Guatemala

---

## Qué es

GuateVigila es una herramienta de transparencia que detecta patrones de riesgo en contrataciones públicas de Guatemala usando datos OCDS de Guatecompras. El objetivo es convertir semanas de investigación periodística manual en segundos.

**Tagline:** *"Lo que tarda semanas, en segundos."*

**Lenguaje del producto:** Nunca "corrupción" — siempre "patrón anómalo" o "señal de riesgo". Técnicamente defendible, legalmente seguro.

---

## Usuarios objetivo

| Usuario | Descripción |
|---|---|
| **Primario** | Periodista de investigación (Plaza Pública, No Ficción, Prensa Comunitaria) |
| **Secundario** | Analista de ONG/watchdog (Acción Ciudadana, Red Ciudadana) |
| **Terciario** | Auditor de la Contraloría General de Cuentas |
| **Ocasional** | Ciudadano interesado en su municipio |

---

## Dataset

**Fuente:** Guatecompras OCDS (`datos.minfin.gob.gt`) — CC BY 4.0, actualización diaria.
**Período:** 2020–2024 · **Descargado:** 2026-05-15

Tablas principales y filas:

| Tabla | Filas |
|---|---|
| `main` | 276,599 |
| `awards` | 221,263 |
| `awards_suppliers` | 221,264 |
| `contracts` | 13,247 |
| `bids_details` | 505,811 |
| `parties` | 1,118,619 |
| `tender_items` | 486,771 |

**Notas de calidad críticas:**
- `tender_procurementMethod` es `open` en 99.999% — inútil. Usar `tender_procurementMethodDetails`.
- `bids_details.value_amount` siempre 0.0 — inútil. Usar `tender_numberOfTenderers`.
- Fechas aberrantes (año 0001) en `tenderPeriod_endDate` — filtrar con `year > 2000`.
- Join principal entre tablas: campo `main_ocid`.
- Un mismo proveedor puede aparecer bajo múltiples IDs (`GT-NIT-xxx` y `GT-GCID-xxx`) — agregar por nombre, no por ID.
- Postgres es case-sensitive: columnas como `tender_numberOfTenderers` deben ir entre comillas dobles en SQL.
- `year()` es DuckDB-only — en Postgres usar `EXTRACT(year FROM ...)`.

---

## Las 5 señales de detección

| # | Señal | Umbral |
|---|---|---|
| 1 | Proveedor único recurrente | `numberOfTenderers = 1` en ≥60% de contratos, ≥5 contratos |
| 2 | Licitaciones de plazo imposible | `endDate - startDate < 72h`, ≥3 casos |
| 3 | Abuso de compra directa | `tender_procurementMethodDetails ILIKE '%Art. 43%'` en ≥70% de procesos |
| 4 | Adjudicación sin contrato | ratio `awards/contracts < 15%` en entidades con ≥20 awards |
| 5 | Tasa anómala de desiertos | `withdrawn + unsuccessful ≥ 50%` en entidades con ≥20 concursos |

**Score de riesgo:** 1 señal → medio · 2 señales → alto · 3+ → crítico

---

## Stack técnico actual

- **Framework:** Next.js 16.2.6 (App Router, React 19)
- **Estilos:** Tailwind CSS v4
- **DB (producción):** Neon (serverless Postgres) vía `@neondatabase/serverless`
- **DB (desarrollo local):** DuckDB en memoria cargando CSVs vía `@duckdb/node-api`
- **IA:** MiniMax API (borrador periodístico on-demand)
- **Deploy:** Vercel

---

## Arquitectura de datos

El adaptador se selecciona automáticamente según variables de entorno:

```
DATABASE_URL  → Neon (producción / Vercel)
OCDS_DATA_DIR → DuckDB con CSVs locales (desarrollo)
```

Ambos adaptadores exponen la misma interfaz `query<T>(sql: string): Promise<T[]>`.

Migración de CSVs a Neon: `scripts/migrate_to_postgres.py`

---

## Estructura del repo

```
guate-vigila/
├── app/
│   ├── page.tsx                  # Cola de alertas (home)
│   ├── alertas/[id]/page.tsx     # Detalle de alerta
│   ├── entidades/
│   │   ├── page.tsx              # Explorador de entidades
│   │   └── [id]/page.tsx         # Perfil de entidad
│   ├── proveedores/
│   │   ├── page.tsx              # Explorador de proveedores
│   │   └── [id]/page.tsx         # Perfil de proveedor
│   ├── faq/page.tsx              # Metodología
│   ├── not-found.tsx             # 404 global
│   ├── error.tsx                 # Error boundary global
│   ├── robots.ts
│   └── sitemap.ts
├── components/guatevigila/
│   ├── header.tsx                # Nav con mobile drawer
│   ├── stats-bar.tsx             # Barra de stats global
│   ├── alert-card.tsx
│   ├── entity-list.tsx
│   ├── entity-detail-tabs.tsx    # Tabs tabla/grafo en perfil de entidad
│   ├── entity-graph.tsx          # Grafo React Flow
│   ├── supplier-contracts.tsx
│   ├── metric-card.tsx
│   ├── risk-badge.tsx
│   └── ai-assistant-button.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts              # Selección de adaptador
│   │   └── adapters/
│   │       ├── neon.ts           # Neon serverless
│   │       └── duckdb.ts         # DuckDB local CSV
│   ├── sdk/
│   │   ├── client.ts             # Objeto client con todos los métodos
│   │   ├── types.ts              # Tipos TypeScript
│   │   ├── mock-data.ts          # Datos mock (alerts y suppliers aún pendientes)
│   │   └── queries/
│   │       ├── alerts.ts         # ⚠️ Aún usa mock data
│   │       ├── entities.ts       # ✓ Queries reales
│   │       ├── suppliers.ts      # ⚠️ getSuppliers/getSupplierById usan mock
│   │       └── stats.ts          # ✓ Queries reales
│   └── constants/
│       └── site.ts               # SEO constants (SITE, META, SOCIAL)
├── scripts/
│   └── migrate_to_postgres.py    # Migración CSV → Neon
└── public/
    ├── guate-vigila-black.svg
    ├── guate-vigila-black.png
    ├── guate-vigila-red.svg
    ├── guate-vigila-red.png
    └── site.webmanifest
```

---

## Patrones de código importantes

**No usar barrel files** — importar siempre directamente desde el archivo fuente:
```ts
// ✓ correcto
import { client } from '@/lib/sdk/client'
import { Header } from '@/components/guatevigila/header'

// ✗ incorrecto
import { client } from '@/lib/sdk'
import { Header } from '@/components/guatevigila'
```

**Suspense en todas las páginas** — cada página extrae la carga de datos a un async component hijo envuelto en `<Suspense fallback={<Skeleton />}>`. El header y el shell se renderizan inmediatamente.

**StatsBar** — siempre recibe un único prop `stats: GlobalStats`, nunca props individuales.

**SQL con Postgres** — columnas camelCase siempre entre comillas dobles. Nunca usar `year()`, usar `EXTRACT(year FROM ...)`.

**Claves de listas** — en `awards_suppliers`, el mismo proveedor puede tener múltiples IDs. Siempre agrupar por `s.name` (no `s.id`) para evitar duplicados.

---

## Estado actual (2026-05-16)

| Sección | Datos | Estado |
|---|---|---|
| Alertas (home) | Mock | ⚠️ Pendiente real |
| Detalle de alerta | Mock | ⚠️ Pendiente real |
| Entidades (lista) | Real | ✓ |
| Perfil de entidad | Real | ✓ |
| Proveedores (lista) | Mock | ⚠️ Pendiente real |
| Perfil de proveedor | Mock | ⚠️ Pendiente real |
| Stats bar | Real | ✓ |

---

## Variables de entorno

```bash
# Desarrollo local (DuckDB)
OCDS_DATA_DIR=/ruta/a/gt_2024/2024

# Producción (Neon)
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# IA
MINIMAX_API_KEY=
```

Si `DATABASE_URL` está definido, toma precedencia sobre `OCDS_DATA_DIR`.
