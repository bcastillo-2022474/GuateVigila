# GuateVigila — Technical Specification

> Complementa el Product Foundation Document · Mayo 2026

---

## Stack tecnológico

### Backend — Pipeline de datos
- **Lenguaje:** Python 3.12
- **Procesamiento:** DuckDB (queries SQL sobre CSV directamente, sin cargar en memoria)
- **Scheduler:** script cron o GitHub Actions para re-procesar semanalmente
- **Salida:** JSON estático generado en build time

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Estilos:** Tailwind CSS
- **Deploy:** Vercel (gratis, suficiente para el hackathon)

### IA — Borrador periodístico
- **Proveedor:** MiniMax (disponible como perk del hackathon)
- **Fallback:** Claude API via OpenRouter (también disponible como perk)
- **Estrategia:** llamada on-demand cuando el usuario hace click en "Generar borrador", no en build time

### Datos
- **Fuente principal:** OCDS Guatecompras vía `data.open-contracting.org`
- **Formato:** CSV por año (2020–2024), descargado una vez y procesado localmente
- **Licencia:** CC BY 4.0

---

## Arquitectura general

```
[OCDS CSV 2020-2024]
        │
        ▼
[Pipeline Python / DuckDB]
        │  detección de señales
        │  cálculo de scores
        ▼
[alerts.json + entities.json + suppliers.json]  ← archivos estáticos
        │
        ▼
[Next.js Frontend]
        │  lee JSON en build time (ISR cada 24h)
        │  llama MiniMax API on-demand para borradores
        ▼
[Usuario final — sin login, sin DB]
```

La arquitectura es deliberadamente simple: el pipeline corre offline, genera JSON estático, y el frontend los consume. No hay base de datos en producción. No hay autenticación. No hay estado del lado del servidor.

---

## Estructura de datos

### Alerta (alert)

```json
{
  "id": "GT-IGSS-2387412-2024",
  "entity_id": "GT-NIT-01013261",
  "entity_name": "IGSS",
  "supplier_id": "GT-NIT-2387412",
  "supplier_name": "BODEGA FARMACÉUTICA S.A.",
  "year": 2024,
  "risk_score": 94,
  "risk_level": "high",
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
      "label": "Licitaciones < 48h",
      "value": 12,
      "threshold": 3,
      "contracts_affected": 12
    },
    {
      "type": "direct_purchase_abuse",
      "label": "Abuso compra directa",
      "value": 0.87,
      "threshold": 0.70,
      "contracts_affected": 38
    }
  ],
  "total_amount_gtq": 4200000,
  "contract_count": 38,
  "guatecompras_url": "https://www.guatecompras.gt/proveedores/...",
  "registro_mercantil_url": "https://eregistros.registromercantil.gob.gt/?nit=2387412",
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

El pipeline se ejecuta en Python sobre los CSV del OCDS. Usa DuckDB para no cargar los archivos completos en memoria (el CSV de 2024 tiene 276k filas en main.csv y 5 archivos relacionados).

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

```python
def calculate_risk_score(signals: list[dict]) -> int:
    """
    Score 0-100 basado en número y severidad de señales.
    Cada señal aporta puntos según qué tan lejos está del umbral.
    """
    weights = {
        "single_bidder":      35,
        "short_deadline":     25,
        "direct_purchase":    20,
        "award_gap":          10,
        "failed_tenders":     10,
    }
    score = 0
    for signal in signals:
        base_weight = weights.get(signal["type"], 0)
        # Amplificador: qué tan lejos está del umbral (max 2x)
        severity = min(signal["value"] / signal["threshold"], 2.0)
        score += base_weight * severity
    return min(int(score), 100)
```

---

## API del frontend

El frontend consume archivos JSON estáticos ubicados en `/public/data/`. No hay API dinámica.

```
/public/data/
  alerts.json          # todas las alertas, ordenadas por risk_score desc
  entities/
    index.json         # listado de entidades con métricas básicas
    {buyer_id}.json    # perfil completo de cada entidad
  suppliers/
    index.json         # listado de proveedores con métricas básicas
    {supplier_id}.json # perfil completo de cada proveedor
  meta.json            # fecha de última actualización, totales
```

La búsqueda de texto en el frontend se hace con un índice en memoria (Fuse.js) sobre `alerts.json` y los índices. No requiere backend.

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
Proveedor: ${alert.supplier_name} (NIT: ${alert.supplier_id})
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
guatevigila/
├── pipeline/
│   ├── download.sh          # descarga CSVs del OCDS
│   ├── detect.py            # lógica de detección (DuckDB)
│   ├── score.py             # cálculo de risk score
│   ├── export.py            # genera JSON estáticos
│   └── requirements.txt
│
├── web/                     # Next.js app
│   ├── app/
│   │   ├── page.tsx         # cola de alertas
│   │   ├── alert/[id]/      # detalle de alerta
│   │   ├── entity/[id]/     # perfil de entidad
│   │   ├── supplier/[id]/   # perfil de proveedor
│   │   └── api/draft/       # endpoint borrador IA
│   ├── public/data/         # JSON generados por el pipeline
│   └── package.json
│
├── README.md
└── LICENSE                  # MIT
```

---

## División de trabajo — 48 horas

| Persona | Rol | Tareas |
|---|---|---|
| 1 (Claude Code) | Pipeline | `download.sh` + señales 1, 2, 3 en DuckDB + `export.py` |
| 2 (Claude Code) | Pipeline + API IA | Señales 4, 5 + score.py + endpoint `/api/draft` |
| 3 | Frontend | Cola de alertas + detalle de alerta + búsqueda |
| 4 | Frontend + QA | Perfil entidad + perfil proveedor + deploy Vercel |

**Hitos:**

- **T+8h:** Pipeline corriendo, genera alerts.json con datos reales
- **T+16h:** Frontend muestra alertas reales, detalle funcional
- **T+24h:** Perfiles de entidad y proveedor funcionando
- **T+36h:** Borrador IA integrado, exportación JSON
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
# 1. Clonar y configurar
git clone https://github.com/guatevigila/guatevigila
cd guatevigila

# 2. Correr pipeline (requiere Python 3.12 + pip)
cd pipeline
pip install -r requirements.txt
bash download.sh        # descarga CSVs (~2GB, solo primera vez)
python detect.py        # genera alertas
python score.py         # calcula scores
python export.py        # genera JSON en ../web/public/data/

# 3. Correr frontend
cd ../web
npm install
npm run dev             # localhost:3000

# 4. Deploy
vercel deploy --prod    # requiere cuenta Vercel (gratis)
```

Variables de entorno requeridas:
```
MINIMAX_API_KEY=...
```

---

*GuateVigila · Open source · MIT License*
*Datos: OCDS Guatecompras (CC BY 4.0)*
