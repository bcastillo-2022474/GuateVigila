# GuateVigila — Technical Specification

> Complementa el Product Foundation Document · Mayo 2026

---

## Stack tecnológico

### Frontend + Backend
- **Framework:** Next.js 15 (App Router)
- **Estilos:** Tailwind CSS
- **Lenguaje:** TypeScript
- **Deploy:** Vercel

### Base de datos
- **Motor:** DuckDB (`@duckdb/node-api`) — embebido en el proceso de Next.js
- **Datos:** CSV OCDS cargados en memoria al arrancar el servidor, consultados con SQL estándar
- **Sin ETL:** no hay pipeline separado ni archivos intermedios — Next.js consulta los CSV directamente

### IA — Borrador periodístico
- **Proveedor:** MiniMax (disponible como perk del hackathon)
- **Fallback:** Claude API via OpenRouter
- **Estrategia:** llamada on-demand cuando el usuario hace click en "Generar borrador"

### Datos
- **Fuente principal:** OCDS Guatecompras, Ministerio de Finanzas de Guatemala
- **Formato:** CSV por año (2020–2024), descargados una vez y montados localmente
- **Licencia:** CC BY 4.0

---

## Arquitectura general

```
[OCDS CSV 2020-2024]  ←  montados localmente
        │
        ▼
[DuckDB en memoria]   ←  cargado al arrancar Next.js (lazy, singleton)
        │  SQL queries directas sobre los CSV
        ▼
[lib/sdk/queries/]    ←  una función por recurso (entities, suppliers, alerts, stats)
        │
        ▼
[lib/sdk/client.ts]   ←  objeto `client` que agrupa todas las queries
        │
        ▼
[Next.js Server Components]  ←  llaman client.getEntityById(id), etc.
        │  datos pasados como props a Client Components
        ▼
[Usuario final — sin login, sin API routes de datos]
```

No hay pipeline separado, no hay archivos JSON generados, no hay backend independiente. Todo corre dentro del proceso de Next.js. DuckDB se inicializa una vez en el primer request y reutiliza la conexión para los siguientes.

La arquitectura es deliberadamente simple: las queries SQL viven en `lib/sdk/queries/`, se ejecutan en runtime sobre DuckDB embebido, y los Server Components consumen el SDK directamente. No hay base de datos externa, no hay autenticación y no hay estado persistente del lado del servidor.

---

## Estructura de datos

### Alerta (alert)

```json
{
  "id": "GT-NIT-01013261::GT-NIT-2387412::single_bidder",
  "entity_id": "GT-NIT-01013261",
  "entity_name": "IGSS",
  "supplier_id": "GT-NIT-2387412",
  "supplier_name": "BODEGA FARMACÉUTICA S.A.",
  "year": 2024,
  "risk_score": 80,
  "risk_level": "critical",
  "signal_key": "single_bidder",
  "signal_type": "Proveedor único recurrente",
  "signals": [
    {
      "type": "single_bidder",
      "label": "Proveedor único recurrente",
      "value": 0.91,
      "threshold": 0.60,
      "contracts_affected": 35
    },
    {
      "type": "short_deadline",
      "label": "Plazo < 72h",
      "value": 12,
      "threshold": 3,
      "contracts_affected": 12
    },
    {
      "type": "direct_purchase",
      "label": "Abuso compra directa",
      "value": 0.87,
      "threshold": 0.70,
      "contracts_affected": 38
    }
  ],
  "total_amount_gtq": 4200000,
  "contract_count": 38,
  "registro_mercantil_url": "https://eregistros.registromercantil.gob.gt/index.jsp?nit=2387412",
  "created_at": "2026-05-15"
}
```

### Entidad (entity)

```json
{
  "id": "GT-NIT-01013261",
  "name": "IGSS",
  "total_contracts_2024": 221,
  "total_amount_gtq_2024": 48000000,
  "direct_purchase_ratio": 0.87,
  "withdrawn_ratio": 0.08,
  "unsuccessful_ratio": 0.05,
  "awards_without_contract_ratio": 0.94,
  "active_alerts": 3,
  "top_suppliers": [
    { "id": "GT-NIT-2387412", "name": "BODEGA FARMACÉUTICA", "amount": 4200000, "contracts": 38 }
  ],
  "yearly_spend": {
    "2020": 31000000,
    "2021": 35000000,
    "2022": 39000000,
    "2023": 44000000,
    "2024": 48000000
  }
}
```

### Proveedor (supplier)

```json
{
  "id": "GT-NIT-2387412",
  "name": "BODEGA FARMACÉUTICA S.A.",
  "active_alerts": 3,
  "yearly_contracts": {
    "2020": { "count": 12, "amount_gtq": 1200000 },
    "2021": { "count": 18, "amount_gtq": 1800000 },
    "2022": { "count": 19, "amount_gtq": 2100000 },
    "2023": { "count": 31, "amount_gtq": 3900000 },
    "2024": { "count": 38, "amount_gtq": 4200000 }
  },
  "entity_count_2024": 3,
  "single_bidder_ratio": 0.91,
  "registro_mercantil_url": "https://eregistros.registromercantil.gob.gt/?nit=2387412"
}
```

---

## Pipeline de detección

El pipeline se implementa como queries SQL en `lib/sdk/queries/alerts.ts` y corre en runtime sobre DuckDB embebido en Next.js. Usa los CSV del OCDS como source of truth sin generar artefactos intermedios.

### Joins base

```sql
-- Vista principal: contrato con proveedor y entidad
CREATE VIEW base AS
SELECT
  m.ocid,
  m.buyer_id,
  m.buyer_name,
  m.tender_procurementMethodDetails  AS method,
  m.tender_numberOfTenderers         AS n_bidders,
  m.tender_tenderPeriod_startDate    AS start_date,
  m.tender_tenderPeriod_endDate      AS end_date,
  m.tender_status                    AS tender_status,
  a.status                           AS award_status,
  a.value_amount                     AS amount,
  s.id                               AS supplier_id,
  s.name                             AS supplier_name
FROM main m
LEFT JOIN awards a ON a.main_ocid = m.ocid
LEFT JOIN awards_suppliers s ON s.main_ocid = m.ocid
  AND s.awards_id = a.id;
```

### Señal 1 — Proveedor único recurrente

```sql
-- Por par (entidad, proveedor): contratos donde era único oferente
CREATE VIEW signal_single_bidder AS
SELECT
  buyer_id,
  buyer_name,
  supplier_id,
  supplier_name,
  COUNT(*)                                    AS total_contracts,
  SUM(CASE WHEN n_bidders = 1 THEN 1 ELSE 0 END) AS single_bidder_count,
  SUM(amount)                                 AS total_amount,
  ROUND(
    SUM(CASE WHEN n_bidders = 1 THEN 1 ELSE 0 END)::FLOAT / COUNT(*), 2
  )                                           AS single_bidder_ratio
FROM base
WHERE award_status = 'active'
GROUP BY buyer_id, buyer_name, supplier_id, supplier_name
HAVING total_contracts >= 5          -- mínimo de contratos para ser estadísticamente relevante
   AND single_bidder_ratio >= 0.60;  -- umbral: 60% de contratos sin competencia
```

### Señal 2 — Licitaciones de plazo imposible

```sql
CREATE VIEW signal_short_deadline AS
SELECT
  m.buyer_id,
  m.buyer_name,
  s.supplier_id,
  s.supplier_name,
  COUNT(*)    AS short_deadline_count,
  SUM(amount) AS total_amount
FROM base
WHERE
  end_date > '2000-01-01'   -- filtra fechas aberrantes (año 0001)
  AND DATEDIFF('hour', start_date::TIMESTAMP, end_date::TIMESTAMP) < 72
  AND award_status = 'active'
GROUP BY buyer_id, buyer_name, supplier_id, supplier_name
HAVING short_deadline_count >= 3;
```

Las alertas públicas se fusionan por par `(buyer_id, supplier_id)`: si el mismo par activa varias señales, la cola muestra una sola alerta con score acumulado. Las señales por entidad (`direct_purchase`, `award_gap`, `failed_tenders`) se propagan a los pares del mismo comprador que ya activaron `single_bidder` o `short_deadline`; si no existe ninguno, se adjuntan al proveedor top por monto adjudicado de esa entidad.

### Señal 3 — Abuso de compra directa por entidad

```sql
CREATE VIEW signal_direct_purchase AS
SELECT
  buyer_id,
  buyer_name,
  COUNT(*) AS total,
  SUM(CASE
    WHEN method ILIKE '%Compra Directa%' THEN 1 ELSE 0
  END) AS direct_count,
  ROUND(
    SUM(CASE WHEN method ILIKE '%Compra Directa%' THEN 1 ELSE 0 END)::FLOAT / COUNT(*), 2
  ) AS direct_ratio
FROM base
GROUP BY buyer_id, buyer_name
HAVING total >= 20
   AND direct_ratio >= 0.70;  -- umbral: más del doble del promedio nacional (~31%)
```

### Señal 4 — Gap adjudicación sin contrato

```sql
-- Entidades con muchas adjudicaciones que nunca generaron contrato formal
CREATE VIEW signal_award_gap AS
SELECT
  m.buyer_id,
  m.buyer_name,
  COUNT(DISTINCT a.id)  AS total_awards,
  COUNT(DISTINCT c.id)  AS total_contracts,
  ROUND(
    1.0 - COUNT(DISTINCT c.id)::FLOAT / NULLIF(COUNT(DISTINCT a.id), 0), 2
  )                     AS gap_ratio
FROM main m
LEFT JOIN awards a ON a.main_ocid = m.ocid
LEFT JOIN contracts c ON c.main_ocid = m.ocid
GROUP BY m.buyer_id, m.buyer_name
HAVING total_awards >= 20
   AND gap_ratio >= 0.85;  -- 85%+ de adjudicaciones sin contrato
```

### Señal 5 — Tasa anómala de desiertos / prescindidos

```sql
-- Promedio nacional: withdrawn ~13.6%, unsuccessful ~12.3% → ~26% combinado
CREATE VIEW signal_failed_tenders AS
SELECT
  buyer_id,
  buyer_name,
  COUNT(*) AS total,
  SUM(CASE WHEN tender_status IN ('withdrawn', 'unsuccessful') THEN 1 ELSE 0 END) AS failed_count,
  ROUND(
    SUM(CASE WHEN tender_status IN ('withdrawn', 'unsuccessful') THEN 1 ELSE 0 END)::FLOAT / COUNT(*), 2
  ) AS failed_ratio
FROM base
GROUP BY buyer_id, buyer_name
HAVING total >= 20
   AND failed_ratio >= 0.50;  -- umbral: el doble del promedio nacional
```

### Cálculo del score de riesgo

```ts
const weights = {
  single_bidder: 35,
  short_deadline: 25,
  direct_purchase: 20,
  award_gap: 10,
  failed_tenders: 10,
} as const

function calculateRiskScore(activeSignals: SignalType[]): number {
  const score = activeSignals.reduce((total, signal) => total + weights[signal], 0)
  return Math.min(score, 100)
}
```

`guatecompras_url` es opcional en el detalle público: solo se expone cuando puede derivarse de forma confiable del dataset actual. `registro_mercantil_url` se expone para IDs `GT-NIT-*`.

---

## Capa de datos

No hay archivos JSON estáticos ni API routes de datos. Los Server Components de Next.js llaman directamente al SDK:

```ts
// En cualquier Server Component:
import { client } from '@/lib/sdk'

const entity = await client.getEntityById(id)
const [alerts, stats] = await Promise.all([client.getAlerts(), client.getGlobalStats()])
```

El SDK resuelve cada llamada con una query SQL sobre DuckDB. Los Client Components reciben los datos como props — nunca llaman al SDK directamente.

### Endpoint de IA — Borrador periodístico

Única llamada dinámica del sistema. Se hace desde el cliente directamente a MiniMax (o Claude via OpenRouter) con el contexto de la alerta.

```typescript
// app/api/draft/route.ts
export async function POST(req: Request) {
  const { alert } = await req.json()

  const prompt = `
Eres un periodista de investigación guatemalteco.
Escribe un párrafo de apertura de 100-120 palabras para una investigación
basada en los siguientes datos de contratación pública.
No acuses, presenta los hechos y el patrón estadístico detectado.
Usa un tono periodístico directo.

Entidad: ${alert.entity_name}
Proveedor: ${alert.supplier_name} (Identificador: ${alert.supplier_id})
Monto total: Q${alert.total_amount_gtq.toLocaleString()}
Contratos: ${alert.contract_count}
Señales detectadas: ${alert.signals.map(s => s.label).join(', ')}
Detalle: ${JSON.stringify(alert.signals)}
`

  const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'abab6.5s-chat',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  })

  const data = await response.json()
  return Response.json({ draft: data.choices[0].message.content })
}
```

---

## Estructura del repositorio

```
guate-vigila/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Cola de alertas (vista de entrada)
│   ├── alertas/[id]/           # Detalle de alerta
│   ├── entidades/
│   │   ├── page.tsx            # Explorador de entidades
│   │   └── [id]/               # Perfil de entidad
│   └── proveedores/
│       ├── page.tsx            # Explorador de proveedores
│       └── [id]/               # Perfil de proveedor
│
├── components/guatevigila/     # Componentes de UI compartidos
│
├── lib/
│   ├── db.ts                   # Cliente DuckDB (singleton, lazy init, carga CSV)
│   └── sdk/
│       ├── client.ts           # Objeto `client` — punto de entrada único
│       ├── queries/
│       │   ├── alerts.ts       # getAlerts, getAlertById
│       │   ├── entities.ts     # getEntities, getEntityById
│       │   ├── suppliers.ts    # getSuppliers, getSupplierById
│       │   └── stats.ts        # getGlobalStats
│       └── types.ts
│
├── README.md
└── LICENSE                     # MIT
```

---

## División de trabajo — 48 horas

| Persona | Rol | Tareas |
|---|---|---|
| 1 | Data + SDK | Queries DuckDB: señales 1, 2, 3 + `lib/sdk/queries/` |
| 2 | Data + API IA | Señales 4, 5 + score de riesgo + endpoint `/api/draft` |
| 3 | Frontend | Cola de alertas + detalle de alerta + búsqueda |
| 4 | Frontend + QA | Perfil entidad + perfil proveedor + deploy Vercel |

**Hitos:**

- **T+8h:** Queries DuckDB funcionando, SDK retorna datos reales
- **T+16h:** Frontend muestra alertas reales, detalle funcional
- **T+24h:** Perfiles de entidad y proveedor funcionando
- **T+36h:** Borrador IA integrado
- **T+44h:** QA completo, deploy en Vercel con dominio
- **T+48h:** Demo lista

---

## Consideraciones de calidad de datos

Problemas conocidos del dataset OCDS Guatemala que el pipeline debe manejar:

| Problema | Campo afectado | Solución |
|---|---|---|
| Fechas con año 0001 | `tender_tenderPeriod_endDate` | Filtrar `WHERE end_date > '2000-01-01'` |
| `dateSigned` con espacio en el año | `contracts/dateSigned` | `REGEXP_REPLACE` antes de parsear |
| `procurementMethod` siempre `open` | `tender_procurementMethod` | Usar `tender_procurementMethodDetails` |
| `bids value_amount` siempre 0.0 | `bids_details.value_amount` | Ignorar, usar `tender_numberOfTenderers` |
| Entradas duplicadas en `tender/tenderers` | `bids_details_tenderers` | `DISTINCT` en joins |

---

## Umbrales de detección — justificación

Los umbrales no son arbitrarios. Se derivan de los promedios nacionales observados en el dataset:

| Señal | Promedio nacional | Umbral de alerta | Razonamiento |
|---|---|---|---|
| Proveedor único | ~40% de concursos con 1 oferente | ≥ 60% en ≥5 contratos | 1.5x el promedio nacional |
| Plazo corto | Minoría documentada | ≥ 3 casos con < 72h | Patrón recurrente, no incidente |
| Compra directa | ~31% del total | ≥ 70% en entidad | Más del doble del promedio |
| Gap adjudicación | 94% a nivel nacional | ≥ 85% en ≥20 awards | Umbral alto por anomalía sistémica |
| Desiertos/prescindidos | ~26% combinado | ≥ 50% en ≥20 concursos | El doble del promedio nacional |

Los umbrales pueden ajustarse. El código los expone como constantes configurables.

---

## Deploy

```bash
# 1. Clonar e instalar
git clone https://github.com/bcastillo-2022474/guate-vigila
cd guate-vigila
pnpm install

# 2. Configurar ruta de datos en lib/db.ts
#    DATA_DIR debe apuntar a la carpeta con los CSV del OCDS
const DATA_DIR = '/ruta/a/tu/carpeta/2024'

# 3. Correr en desarrollo
pnpm dev    # localhost:3000
            # primer request tarda ~10-30s mientras DuckDB carga los CSV

# 4. Deploy en Vercel
vercel deploy --prod
```

Variables de entorno requeridas:
```
MINIMAX_API_KEY=...
```

> **Nota sobre Vercel:** DuckDB requiere acceso a los archivos CSV en el servidor. En producción, los CSV deben estar disponibles en el filesystem del servidor (o montados via volumen). La capa serverless de Vercel tiene limitaciones de memoria — evaluar uso de Vercel Functions con memoria extendida o migrar a un servidor dedicado si el dataset crece.

---

*GuateVigila · Open source · MIT License*
*Datos: OCDS Guatecompras (CC BY 4.0)*
