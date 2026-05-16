# GuateVigila — Onboarding para contribuidores

> Leer también: `PRODUCT_FOUNDATION.md` (qué construimos y por qué) · `TECHNICAL_SPEC.md` (arquitectura original)

---

## Setup inicial — todos deben hacer esto

```bash
git clone <repo>
cd guate-vigila
pnpm install
pnpm dev   # → http://localhost:3000
```

**Los CSVs** viven en `/home/joao/Downloads/gt_2024/2024/` en la máquina de desarrollo. La ruta está en `lib/db.ts` como `DATA_DIR`. Si corres en otra máquina, cámbiala ahí.

**Primera carga:** DuckDB carga ~1.7 GB de CSVs en memoria al arrancar — tarda ~4 segundos. Las queries posteriores son instantáneas. Esto es normal.

---

## Cómo está organizado el código

```
lib/
  db.ts                    ← conexión DuckDB singleton + función query()
  sdk/
    types.ts               ← FUENTE DE VERDAD de todos los tipos TypeScript
    client.ts              ← objeto `client` que expone el SDK
    index.ts               ← re-exports públicos
    queries/
      alerts.ts            ← getAlerts(), getAlertById()
      entities.ts          ← getEntities(), getEntityById()
      suppliers.ts         ← getSuppliers(), getSupplierById()
      stats.ts             ← getGlobalStats()
    mock-data.ts           ← datos falsos (reemplazar con queries reales)

app/
  page.tsx                 ← cola de alertas (/)
  alertas/[id]/page.tsx    ← detalle de alerta
  entidades/page.tsx       ← lista de entidades (/entidades)
  entidades/[id]/page.tsx  ← perfil de entidad
  proveedores/page.tsx     ← lista de proveedores (/proveedores)
  proveedores/[id]/page.tsx ← perfil de proveedor

components/guatevigila/    ← componentes de UI del producto
```

**Regla fundamental:** nunca importes desde `lib/sdk/mock-data.ts` en código nuevo. Si una query aún no está implementada, devuelve `[]` o `null` — no uses mocks.

---

## La función `query<T>()`

Todo acceso a datos pasa por esta función en `lib/db.ts`:

```typescript
import { query } from '@/lib/db'

const rows = await query<{ buyer_name: string; total: number }>(`
  SELECT buyer_name, COUNT(*) AS total
  FROM main
  GROUP BY buyer_name
  ORDER BY total DESC
  LIMIT 10
`)
// rows es Row[], cada campo es el nombre de la columna SQL
```

Los tipos que devuelve DuckDB son primitivos JS — siempre castea con `Number()`, `String()`, `Boolean()` antes de asignar a tipos TS.

---

## Tablas disponibles en DuckDB

| Tabla | Filas | Para qué sirve |
|---|---|---|
| `main` | 276,599 | Una fila por licitación. Contiene entidad compradora, modalidad, fechas, número de oferentes |
| `awards` | 221,263 | Adjudicaciones. Contiene monto (`value_amount`) y estado (`active` / `cancelled`) |
| `awards_suppliers` | 221,264 | Join entre adjudicación y proveedor ganador |
| `contracts` | 13,247 | Contratos formalizados (solo el 5.7% de awards tiene uno) |
| `parties` | 1,118,619 | Entidades en roles: `buyer`, `supplier`, `tenderer`, `awardComiteeMember` |
| `tender_items` | 486,771 | Productos/servicios licitados, clasificados con UNSPSC |
| `bids_details` | 505,811 | Ofertas presentadas (el campo `value_amount` siempre es 0 — no usar) |
| `sources` | 276,690 | Metadatos de publicación |

**Join base más usado:**
```sql
FROM main m
JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
JOIN awards_suppliers s ON s.awards_id = a.id
```

**Gotchas conocidos del dataset — siempre aplicar:**
- Filtrar fechas aberrantes: `WHERE year(m.tender_tenderPeriod_startDate) > 2000`
- Número de oferentes está en `main.tender_numberOfTenderers` (INTEGER), no en bids
- La modalidad legal útil es `main.tender_procurementMethodDetails`, no `tender_procurementMethod` (siempre es `open`)
- NITs de empresas: `GT-NIT-{número}`. Personas naturales: `GT-NIT-{número}K`. Extranjeros: `GT-GCID-XX-...`

El schema completo con todos los campos está en `/home/joao/Downloads/gt_2024/schema.md`.

---

## Tipos del SDK — leer antes de escribir código

El archivo `lib/sdk/types.ts` es la fuente de verdad. Estas son las interfaces que debes respetar:

```typescript
type SignalType =
  | 'single_bidder'
  | 'short_deadline'
  | 'direct_purchase'
  | 'award_gap'
  | 'failed_tenders'

// Alerta en la lista principal
interface Alert {
  id: string
  entityId: string
  entityName: string
  riskLevel: RiskLevel          // 'critical' | 'high' | 'medium' | 'low'
  signalKey: SignalType         // identificador estable, ej: "single_bidder"
  signalType: string            // nombre humano de la señal, ej: "Proveedor único recurrente"
  signalIcon: string            // nombre de Material Symbol, ej: "person_off"
  year: string                  // "2024"
  contractCount: number
  totalAmount: number
  currency: string              // siempre "GTQ"
}

// Detalle completo de una alerta
interface AlertDetail {
  id: string
  entityId: string
  entityName: string
  description: string
  riskScore: number             // 0-100
  riskLevel: RiskLevel
  signals: Signal[]
  involvedSupplier: {
    id: string                  // identificador completo del proveedor: GT-NIT-... o GT-GCID-...
    name: string
    nit: string                 // identificador mostrado; para GT-NIT-* va sin prefijo
    totalAwarded: number
    year: number
  }
  draftInvestigation: string    // puede ser string vacío inicialmente
  guatecomprasUrl?: string      // solo si la URL puede derivarse confiablemente
  registroMercantilUrl?: string // disponible para IDs GT-NIT-*
  networkMapUrl?: string
}

interface Signal {
  id: string
  type: SignalType              // identificador de señal: "single_bidder", "short_deadline", etc.
  title: string                 // ej: "91% de contratos sin competencia"
  description: string           // ej: "Proveedor único recurrente"
  icon: string                  // Material Symbol
  metrics: { label: string; value: string }[]
}

// Proveedor completo (perfil /proveedores/[id])
interface Supplier {
  id: string
  name: string
  nit: string
  industry: string
  totalContracts: number
  totalAwarded: number
  currency: string
  clientEntities: number
  singleBidderPercentage: number
  period: string                // "2020-2024"
  yearlyData: { year: number; amount: number; contractCount: number }[]
  alerts: SupplierAlert[]       // puede ser [] si aún no hay implementación
  associates: Associate[]       // puede ser [] si aún no hay implementación
}
```

---

---

# Persona 1 — Pipeline de detección de señales

**Tu tarea:** implementar las 5 señales de detección que generan alertas reales. Actualmente `getAlerts()` y `getAlertById()` devuelven mock data de `mock-data.ts`.

**Archivo principal:** `lib/sdk/queries/alerts.ts`

---

### Señal 1 — Proveedor único recurrente

Par (entidad, proveedor) donde ≥60% de los contratos no tuvieron competencia, con mínimo 5 contratos.

```sql
SELECT
  m.buyer_id,
  m.buyer_name,
  s.id                                                          AS supplier_id,
  s.name                                                        AS supplier_name,
  COUNT(DISTINCT a.id)                                          AS total_contracts,
  SUM(a.value_amount)                                           AS total_amount,
  COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                      THEN a.id END)                            AS single_bidder_count,
  ROUND(
    COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                        THEN a.id END)::DOUBLE / COUNT(DISTINCT a.id), 4
  )                                                             AS single_bidder_ratio
FROM main m
JOIN awards a          ON a.main_ocid = m.ocid AND a.status = 'active'
JOIN awards_suppliers s ON s.awards_id = a.id
WHERE year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY m.buyer_id, m.buyer_name, s.id, s.name
HAVING COUNT(DISTINCT a.id) >= 5
   AND single_bidder_ratio >= 0.60
ORDER BY total_amount DESC
```

### Señal 2 — Plazo imposible (< 72 horas)

Par (entidad, proveedor) con ≥3 contratos donde el período de convocatoria duró menos de 72 horas.

```sql
SELECT
  m.buyer_id,
  m.buyer_name,
  s.id                                                          AS supplier_id,
  s.name                                                        AS supplier_name,
  COUNT(DISTINCT a.id)                                          AS short_deadline_count,
  SUM(a.value_amount)                                           AS total_amount
FROM main m
JOIN awards a           ON a.main_ocid = m.ocid AND a.status = 'active'
JOIN awards_suppliers s ON s.awards_id = a.id
WHERE year(m.tender_tenderPeriod_startDate) > 2000
  AND year(m.tender_tenderPeriod_endDate) > 2000
  AND DATEDIFF(
        'hour',
        m.tender_tenderPeriod_startDate::TIMESTAMP,
        m.tender_tenderPeriod_endDate::TIMESTAMP
      ) < 72
GROUP BY m.buyer_id, m.buyer_name, s.id, s.name
HAVING short_deadline_count >= 3
ORDER BY total_amount DESC
```

### Señal 3 — Abuso de compra directa

Entidad donde ≥70% de sus adjudicaciones son por Art. 43 LCE o Art. 54 LCE (compra directa), con mínimo 20 adjudicaciones. Esta señal es por entidad, no por par entidad-proveedor.

```sql
SELECT
  m.buyer_id,
  m.buyer_name,
  COUNT(DISTINCT a.id)                                          AS total_awards,
  COUNT(DISTINCT CASE
    WHEN m.tender_procurementMethodDetails ILIKE '%Art. 43%'
      OR m.tender_procurementMethodDetails ILIKE '%Art. 54%'
    THEN a.id END)                                              AS direct_count,
  ROUND(
    COUNT(DISTINCT CASE
      WHEN m.tender_procurementMethodDetails ILIKE '%Art. 43%'
        OR m.tender_procurementMethodDetails ILIKE '%Art. 54%'
      THEN a.id END)::DOUBLE / COUNT(DISTINCT a.id), 4
  )                                                             AS direct_ratio,
  SUM(a.value_amount)                                           AS total_amount
FROM main m
JOIN awards a ON a.main_ocid = m.ocid AND a.status = 'active'
WHERE year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY m.buyer_id, m.buyer_name
HAVING COUNT(DISTINCT a.id) >= 20
   AND direct_ratio >= 0.70
ORDER BY total_amount DESC
```

### Señal 4 — Gap adjudicación sin contrato formal

Entidad donde ≥85% de sus adjudicaciones no generaron contrato registrado, con mínimo 20 adjudicaciones.

```sql
SELECT
  m.buyer_id,
  m.buyer_name,
  COUNT(DISTINCT a.id)                                          AS total_awards,
  COUNT(DISTINCT c.id)                                          AS total_contracts,
  ROUND(
    1.0 - COUNT(DISTINCT c.id)::DOUBLE / COUNT(DISTINCT a.id), 4
  )                                                             AS gap_ratio,
  SUM(a.value_amount)                                           AS total_amount
FROM main m
JOIN awards a     ON a.main_ocid = m.ocid AND a.status = 'active'
LEFT JOIN contracts c ON c.main_ocid = m.ocid
WHERE year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY m.buyer_id, m.buyer_name
HAVING COUNT(DISTINCT a.id) >= 20
   AND gap_ratio >= 0.85
ORDER BY total_amount DESC
```

### Señal 5 — Tasa anómala de desiertos

Entidad donde ≥50% de sus licitaciones quedaron desiertas o fueron prescindidas (promedio nacional: ~26%), con mínimo 20 licitaciones.

```sql
SELECT
  m.buyer_id,
  m.buyer_name,
  COUNT(*)                                                      AS total_tenders,
  SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
           THEN 1 ELSE 0 END)                                   AS failed_count,
  ROUND(
    SUM(CASE WHEN m.tender_status IN ('withdrawn','unsuccessful')
             THEN 1 ELSE 0 END)::DOUBLE / COUNT(*), 4
  )                                                             AS failed_ratio
FROM main m
WHERE year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY m.buyer_id, m.buyer_name
HAVING COUNT(*) >= 20
   AND failed_ratio >= 0.50
ORDER BY failed_ratio DESC
```

---

### Cómo convertir los resultados al tipo `Alert`

El `id` de una alerta debe ser estable y único. Usa este formato:
```
{buyer_id}::{supplier_id}::{signal_type}
```
Por ejemplo: `GT-NIT-01013261::GT-NIT-2387412::single_bidder`

El `riskScore` se calcula por cuántas señales coinciden en el mismo par (entidad, proveedor). Implementa un merge después de correr las 5 queries:

```typescript
// Puntos por señal (suma simple)
const SIGNAL_WEIGHTS = {
  single_bidder:    35,
  short_deadline:   25,
  direct_purchase:  20,
  award_gap:        10,
  failed_tenders:   10,
}
// riskScore = sum de pesos de señales activas, cap 100
// riskLevel: >= 60 → 'critical', >= 40 → 'high', >= 20 → 'medium', < 20 → 'low'
```

La cola pública materializa **una sola alerta por par** `(buyer_id, supplier_id)`. Si un mismo par activa múltiples señales, se fusionan en una sola tarjeta y el `signal_type` del `id` corresponde a la señal principal por prioridad:

```typescript
['single_bidder', 'short_deadline', 'direct_purchase', 'award_gap', 'failed_tenders']
```

Las señales por entidad (`direct_purchase`, `award_gap`, `failed_tenders`) se adjuntan a todos los pares del mismo comprador que ya activaron `single_bidder` o `short_deadline`. Si la entidad no tiene ninguno, se siembra una sola alerta con el proveedor top por monto adjudicado.

Para `getAlertById(id: string)`, el `id` que llega ya tiene el formato `{buyer_id}::{supplier_id}::{signal_type}` — parsea las partes, re-corre las queries del comprador y resuelve el par exacto para construir el `AlertDetail` completo.

**Coordina con Persona 3** para que el `id` que generas aquí coincida con el que se usa en los links `href="/alertas/{id}"` del `AlertCard`.

---

---

# Persona 2 — Perfil de proveedor completo

**Tu tarea:** reemplazar el resolver híbrido actual de `getSupplierById()` en `lib/sdk/queries/suppliers.ts` por el perfil completo de proveedor. Persona 1 ya dejó un perfil mínimo real para cualquier `supplier_id` enlazado desde alertas o entidades, así que `/proveedores/[id]` ya no debería caer en 404 para IDs válidos del dataset.

El `id` que llega como parámetro de ruta es el identificador completo del proveedor tal como viene en `awards_suppliers.id`: normalmente `GT-NIT-12345678`, `GT-NIT-12345678K` o `GT-GCID-...`.

---

### Queries a implementar

Las tres queries deben correr en paralelo con `Promise.all`:

**Query 1 — Resumen del proveedor**
```sql
SELECT
  s.id                                                          AS supplier_id,
  s.name                                                        AS supplier_name,
  COUNT(DISTINCT a.id)                                          AS total_awards,
  SUM(a.value_amount)                                           AS total_amount,
  COUNT(DISTINCT m.buyer_id)                                    AS client_entities,
  COUNT(DISTINCT CASE WHEN m.tender_numberOfTenderers = 1
                      THEN a.id END)                            AS single_bidder_count
FROM awards_suppliers s
JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
JOIN main m   ON m.ocid = a.main_ocid
WHERE s.id = '{id}'
  AND year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY s.id, s.name
```

**Query 2 — Histórico anual**
```sql
SELECT
  year(m.tender_tenderPeriod_startDate)   AS year,
  COUNT(DISTINCT a.id)                    AS contract_count,
  SUM(a.value_amount)                     AS amount
FROM awards_suppliers s
JOIN awards a ON a.id = s.awards_id AND a.status = 'active'
JOIN main m   ON m.ocid = a.main_ocid
WHERE s.id = '{id}'
  AND year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY 1
ORDER BY 1
```

**Query 3 — Co-ganadores (proveedores que ganan en los mismos tenders)**

Esto implementa el detector de cartel del Hallazgo I del EDA. Encuentra otros proveedores que aparecen en los mismos `ocid` que este proveedor:

```sql
SELECT
  s2.id                     AS associate_id,
  s2.name                   AS associate_name,
  COUNT(DISTINCT m.ocid)    AS shared_tenders
FROM awards_suppliers s1
JOIN awards a1 ON a1.id = s1.awards_id AND a1.status = 'active'
JOIN main m    ON m.ocid = a1.main_ocid
JOIN awards a2 ON a2.main_ocid = m.ocid AND a2.status = 'active'
JOIN awards_suppliers s2 ON s2.awards_id = a2.id AND s2.id != '{id}'
WHERE s1.id = '{id}'
  AND year(m.tender_tenderPeriod_startDate) > 2000
GROUP BY s2.id, s2.name
ORDER BY shared_tenders DESC
LIMIT 10
```

---

### Cómo mapear al tipo `Supplier`

```typescript
return {
  id: String(summary.supplier_id),
  name: summary.supplier_name,
  nit: getSupplierDisplayIdentifier(String(summary.supplier_id)),
  industry: 'Pendiente de clasificación',
  totalContracts: Number(summary.total_awards),
  totalAwarded: Number(summary.total_amount),
  currency: 'GTQ',
  clientEntities: Number(summary.client_entities),
  singleBidderPercentage: Math.round(
    (Number(summary.single_bidder_count) / Number(summary.total_awards)) * 100
  ),
  period: '2020-2024',
  yearlyData: yearlyRows.map(r => ({
    year: Number(r.year),
    amount: Number(r.amount),
    contractCount: Number(r.contract_count),
  })),
  alerts: await getSupplierAlertsBySupplierId(String(summary.supplier_id)),
  associates: [],
  registroMercantilUrl: buildRegistroMercantilUrl(String(summary.supplier_id)),
}
```

---

### Link a Registro Mercantil

La UI en `app/proveedores/[id]/page.tsx` ya consume `supplier.registroMercantilUrl`. Mantén esa URL real solo para IDs `GT-NIT-*`:

```
https://eregistros.registromercantil.gob.gt/index.jsp?nit={nit_sin_prefijo}
```

El `nit` sin prefijo es `id.replace('GT-NIT-', '').replace('K', '')`.

---

### Atención: la lista de proveedores (`getSuppliers`)

`lib/sdk/queries/suppliers.ts` también tiene `getSuppliers()` que aún devuelve mock data. Ese método sigue siendo transicional. Cuando Persona 2 lo reemplace por la versión real, debe mantener compatibilidad con el detalle híbrido ya resuelto por `supplier_id` — los campos requeridos para `SupplierListItem` son:

```typescript
interface SupplierListItem {
  id: string
  name: string
  nit: string
  industry: string
  totalContracts: number
  totalAwarded: number
  currency: string
  clientEntities: number
  riskLevel: RiskLevel
  singleBidderPercentage: number
}
```

---

---

# Persona 3 — Cola de alertas + filtros + borrador IA

**Tu tarea:** dos partes independientes que puedes trabajar en paralelo.

---

## Parte A — Cola de alertas con filtros reales

La página principal (`app/page.tsx`) ya llama `client.getAlerts()` y renderiza `<AlertCard>` por cada alerta. Los botones de filtro ("Señal", "Entidad", "Monto", "Año") existen en la UI pero no hacen nada.

**Lo que debes hacer:**

Convierte la cola de alertas en un componente client-side que soporte query params, exactamente igual al patrón ya implementado en `components/guatevigila/entity-list.tsx`. Crea `components/guatevigila/alert-list.tsx` como componente `'use client'`.

Los query params a soportar:

| Param | Ejemplo | Comportamiento |
|---|---|---|
| `?signal=` | `?signal=single_bidder` | Filtra por `alert.signalKey` |
| `?entity=` | `?entity=IGSS` | Fuzzy match contra `alert.entityName` con Fuse.js |
| `?year=` | `?year=2024` | Filtra exacto contra `alert.year` |
| `?page=` | `?page=2` | Paginación, 20 alertas por página |

**El componente `AlertList` debe recibir estas props:**
```typescript
interface AlertListProps {
  alerts: Alert[]
  initialSignal: string
  initialEntity: string
  initialYear: string
  initialPage: number
}
```

El servidor (`app/page.tsx`) lee los searchParams, llama `client.getAlerts()`, y pasa todo a `<AlertList>`. El filtrado y la paginación ocurren client-side sobre los datos ya cargados — mismo patrón que `EntityList`.

**Para el fuzzy search en entidades** usa Fuse.js sobre el campo `entityName` con threshold 0.35 — ya está instalado (`pnpm add fuse.js` ya corrió).

**Reemplaza los `FilterButton` estáticos** del `app/page.tsx` por los controles reales del `AlertList`. El selector de señal debe ser un dropdown con las señales disponibles: `single_bidder`, `short_deadline`, `direct_purchase`, `award_gap`, `failed_tenders`. Muéstralos con sus nombres humanos:

```typescript
const SIGNAL_LABELS: Record<string, string> = {
  single_bidder:   'Proveedor único recurrente',
  short_deadline:  'Plazo imposible',
  direct_purchase: 'Abuso compra directa',
  award_gap:       'Sin contrato formal',
  failed_tenders:  'Alta tasa de desiertos',
}
```

---

## Parte B — Endpoint de borrador periodístico

**Crea:** `app/api/draft/route.ts`

```bash
pnpm add @anthropic-ai/sdk
```

El endpoint recibe el `AlertDetail` completo en el body y devuelve `{ draft: string }`.

```typescript
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: Request) {
  const { alert }: { alert: AlertDetail } = await req.json()
  
  const client = new Anthropic()   // usa ANTHROPIC_API_KEY del env
  
  const signalSummary = alert.signals
    .map(s => `- ${s.description}: ${s.title} (${s.metrics.map(m => `${m.value} ${m.label}`).join(', ')})`)
    .join('\n')

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',   // modelo rápido y barato para esto
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `Eres un periodista de investigación guatemalteco especializado en contratación pública.
Escribe un párrafo de apertura de 100-130 palabras para una nota periodística basada en los siguientes datos de Guatecompras.
No acuses ni afirmes que hubo corrupción. Presenta los hechos y el patrón estadístico detectado con tono periodístico directo.
No uses frases como "según los datos" o "de acuerdo a". Empieza directamente con el hallazgo.

Entidad compradora: ${alert.entityName}
Proveedor involucrado: ${alert.involvedSupplier.name} (Identificador: ${alert.involvedSupplier.nit})
Monto total adjudicado: Q${alert.involvedSupplier.totalAwarded.toLocaleString('es-GT')} en ${alert.involvedSupplier.year}
Señales detectadas:
${signalSummary}`,
    }],
  })

  const draft = message.content[0].type === 'text' ? message.content[0].text : ''
  return Response.json({ draft })
}
```

**Variable de entorno requerida** — agrégala al `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

**Conecta el botón en la UI.** El botón "Generar borrador periodístico" ya existe en `app/alertas/[id]/page.tsx`. Conviértelo en un componente client que:
1. Al hacer click, llama `POST /api/draft` con el `alert` completo
2. Muestra un spinner mientras espera
3. Actualiza el `<textarea>` con el texto devuelto
4. El botón "Copiar al portapapeles" llama `navigator.clipboard.writeText(draft)`

Extrae esa sección del detalle de alerta a `components/guatevigila/draft-section.tsx` como componente `'use client'` para no contaminar el Server Component del `page.tsx`.

---

## Convenciones de UI — mantener consistencia

- Usa tokens de color semánticos de Tailwind: `text-primary`, `bg-muted`, `border-border`, `text-muted-foreground`. No uses colores hardcodeados como `text-red-500`.
- Los íconos son Material Symbols: `<span className="material-symbols-outlined">nombre</span>`. Busca nombres en [fonts.google.com/icons](https://fonts.google.com/icons).
- Para estados de carga usa `<Skeleton>` de `components/ui/skeleton.tsx` — ya existe.
- Para notificaciones usa `sonner` — ya está instalado: `import { toast } from 'sonner'`.
- Los Server Components llaman al SDK directamente. Los Client Components reciben los datos como props o los fetchean desde `/api/` routes.
- Para debouncing en inputs: `useDebouncedCallback` de `use-debounce` — ya instalado.
- Para sincronizar estado con URL: `useRouter().replace()` con `{ scroll: false }` — ver `entity-list.tsx` como referencia completa.
