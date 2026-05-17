# Plan GuateVigila — Hackathon

## Narrativa central

> "Convertimos datos públicos opacos en evidencia accionable. Un periodista o auditor puede llegar a GuateVigila, identificar un caso sospechoso, entender la red de relaciones, y salir con un reporte listo para publicar — en minutos."

---

## 3 features a agregar

### 1. Grafo de red interactivo

**Qué es:** visualización de nodos donde entidades gubernamentales y proveedores están conectados por arcos. El grosor del arco = monto del contrato. Los nodos con alertas activas se destacan en rojo.

**Por qué importa:** "revelar cómo se mueve el dinero" es literalmente el criterio del track. Un proveedor conectado a 12 entidades con contratos directos es inmediatamente obvio en un grafo — en una tabla nadie lo ve.

**Dónde vive:** página nueva `/red` o sección dentro del perfil de proveedor/entidad.

**Stack:** `react-force-graph` o `d3` — los datos ya existen en la DB.

---

### 2. IA investigativa ← el más importante

**Qué es:** en cada página de alerta, un panel donde escribes en lenguaje natural y obtienes un análisis narrativo. No es un chatbot genérico — tiene contexto real: nombre del proveedor, entidades, montos, señales activas, historial anual.

**Ejemplo concreto:**

> Usuario: *"¿hay algo raro aquí?"*
>
> IA: *"CONSTRUCTORA XYZ ha recibido Q142M de 3 ministerios entre 2021-2024, el 87% mediante compra directa (Art. 43). En los últimos 2 años todos sus contratos fueron adjudicados sin competencia. Señales compatibles con fraccionamiento de contratos para evadir licitación pública."*

**Por qué importa:** cierra el loop detección → investigación. El jurado preguntará "¿y qué hace alguien con esto?" — esto responde esa pregunta.

**Stack:** Mistral (sponsor del hackathon) vía OpenRouter (también sponsor). Ya tenemos el botón de AI assistant en la UI, es extenderlo con contexto real.

---

### 3. Exportar reporte PDF

**Qué es:** botón "Descargar reporte" en la página de alerta. Genera un PDF con: nombre entidad/proveedor, señales activas, montos, historial anual, y el análisis de la IA.

**Por qué importa:** periodistas y auditores necesitan llevar evidencia fuera de la app. Es el artefacto concreto que demuestra utilidad real — el jurado puede imaginarse a un fiscal usando esto.

**Stack:** `@react-pdf/renderer` — 1 día de trabajo.

---

## Prioridad si el tiempo es limitado

| Día | Feature | Razón |
|-----|---------|-------|
| 1 | IA investigativa | Mayor impacto en puntos |
| 2 | Grafo de red | Mayor impacto en demo |
| 3 | PDF + pulido UX | Listo para usar |

---

## Scoring estimado

| Criterio | Pts posibles | Ahora | Con features |
|----------|-------------|-------|--------------|
| Impacto Social | 30 | 20 | 27 |
| Moonshot | 20 | 10 | 17 |
| Complejidad Técnica | 20 | 14 | 17 |
| Factor de Novedad | 15 | 8 | 13 |
| Listo para usar | 15 | 12 | 14 |
| **Total** | **100** | **~64** | **~88** |

---

## Para la presentación (Faces + video 1:30)

No demuestren features — cuenten **un caso real** de sus datos:

> *"Encontramos un proveedor que recibió Q300M de 8 entidades distintas, el 90% sin licitación. Con GuateVigila, un periodista llega, ve la alerta, entiende la red, le pregunta a la IA qué significa, y descarga el reporte. Todo en 3 minutos."*

Eso vale más que cualquier demo técnica.

---

## Lo que ya tenemos (no subestimar)

- Datos reales de Guatemala cargados y procesados
- Sistema de alertas con 5 señales de riesgo con scoring
- Perfiles de proveedores y entidades
- Búsqueda fuzzy (pg_trgm)
- Omnisearch con navegación por teclado
- SEO + JSON-LD + sitemap
- Deployed y funcional en producción

---

## Cruce con datasets externos

### ✅ Factible ahora mismo

**1. OFAC Sanctions List (USA)**

49 guatemaltecos en la lista SDN — narcotráfico, lavado de dinero, corrupción. La lista se actualiza continuamente y es descarga directa sin autenticación.

Cómo obtener los datos:
- XML completo: `https://www.treasury.gov/ofac/downloads/sdn.xml`
- CSV delimitado: `https://www.treasury.gov/ofac/downloads/sdn.csv`
- Se puede descargar en el build o con un cron job diario

Qué contiene:
- Nombre completo + aliases
- Tipo de entidad (individual / empresa)
- País
- Fecha de designación
- Motivo (narco, corrupción, terrorismo, etc.)

Cómo hacer el cruce:
1. Descargar el CSV al momento del deploy y cargarlo a una tabla `ofac_sdn` en Neon
2. Fuzzy match por nombre entre `supplier_name` en `alert_pairs` y `sdn.name` (pg_trgm ya instalado)
3. Nueva columna `is_sanctioned` en el perfil del proveedor
4. Nueva señal de alerta: proveedor sancionado recibiendo contratos del Estado

Impacto en demo: *"este proveedor recibió Q50M del Estado y está en la lista negra del Tesoro de EE.UU."* — eso es noticia inmediata y gana el track.

---

**2. MINFIN — Ejecución Presupuestaria (SICOIN)**

El Ministerio de Finanzas publica la ejecución presupuestaria de todas las entidades del Estado por año, en CSV descargable sin autenticación.

Cómo obtener los datos:
- Portal: `https://datos.minfin.gob.gt/dataset/ejecucion-presupuestaria-2024`
- Descarga directa CSV disponible en ese portal (sin login)
- Hay datos desde 2019 hasta 2025

Qué contiene el CSV:
- `entidad` — nombre de la unidad ejecutora
- `aprobado_inicial` — presupuesto aprobado al inicio del año
- `modificacion` — modificaciones presupuestarias durante el año
- `vigente` — presupuesto disponible actualizado
- `devengado` — monto realmente ejecutado/gastado

Cómo hacer el cruce:
1. Descargar los CSVs y cargarlos a una tabla `budget_execution` en Neon
2. Join por nombre de entidad con `buyer_name` en `alert_pairs` (fuzzy con pg_trgm)
3. Calcular: `devengado_contratos` (de Guatecompras) vs `devengado_sicoin` (de MINFIN)
4. Si los contratos adjudicados superan el presupuesto ejecutado → señal de sobreeje­cución sospechosa

Nueva alerta que ningún otro sistema en Guatemala hace hoy.

---

### ⚠️ Difícil / bloqueado

**3. Registro Mercantil**
- OpenCorporates tiene Guatemala indexado pero score 0/100 de apertura — sin directores, sin socios, sin API real
- El portal oficial (`registromercantil.gob.gt`) requiere búsqueda manual por nombre, no hay descarga masiva ni API
- Hay un dataset en `catalogo.senacyt.gob.gt` pero el SSL está roto y no carga
- **Conclusión:** no factible técnicamente en un hackathon

**4. Declaraciones patrimoniales (CGC)**
- La ley las declara confidenciales (Art. 21, Ley de Probidad)
- Solo algunos funcionarios las publican voluntariamente
- No hay dataset descargable
- **Conclusión:** bloqueado legalmente

---

### 💡 Sin dataset externo — puro SQL sobre lo que ya tenemos

**5. Detección de empresas relacionadas**

Sin ningún dataset externo, solo cruzando lo que ya está en la DB:
- Detectar proveedores distintos con NITs consecutivos o con el mismo prefijo (señal de mismo dueño creando múltiples empresas)
- Proveedor que gana contratos de una entidad y simultáneamente tiene contratos con 10+ entidades más en el mismo año
- Grupos de proveedores que solo ganan contratos de la misma entidad compradora (red cerrada)

Costo de implementación: 0 — puro SQL, los datos ya están.

---

## Auditoría de señales de riesgo

Verificación de los 5 thresholds contra datos reales (276,096 procesos, 2,360 alert_pairs).

### Distribución de plazos de licitación (tender period)

| Rango | Contratos | % |
|-------|-----------|---|
| 1–2 días (<72h) | 31,476 | 11.4% |
| 3–6 días | 62,309 | 22.6% |
| 7–14 días | 96,452 | 34.9% |
| 15–29 días | 51,747 | 18.7% |
| 30–59 días | 21,934 | 7.9% |
| 60+ días | 12,178 | 4.4% |

### Estado actual de cada señal

| Señal | Threshold | Pares flaggeados | % alert_pairs |
|-------|-----------|-----------------|---------------|
| `single_bidder` | ≥60% sin competencia, ≥5 contratos | 1,458 | 61.8% |
| `short_deadline` | <72 horas, ≥3 contratos | 1,428 | 60.5% |
| `direct_purchase` | ≥70% Art.43/54, ≥20 contratos | 1,282 | 54.3% |
| `award_gap` | ≥85% sin contrato formal, ≥20 contratos | 1,677 | **71.1% ⚠️** |
| `failed_tenders` | ≥50% desiertos, ≥20 procesos | 6 | **0.3% ⚠️** |

### Problemas detectados

**`award_gap` al 85% flaggea el 71% de todos los pares** — si casi todo está flaggeado, la señal no discrimina. En Guatemala es estructural que los contratos formales lleguen tarde o no lleguen. Hay que subir el threshold a 95%+.

**`failed_tenders` con solo 6 casos** — señal casi muerta. El doble requisito (≥20 procesos Y ≥50% desiertos) es demasiado restrictivo. Bajar el mínimo de procesos a 10.

**`short_deadline` a 72h está bien calibrado** — captura 1,428 pares reales (11.4% de contratos individuales). Cardinal usa 15 días como estándar internacional, pero en Guatemala eso capturaría 5,420 pares — más del doble de los alert_pairs actuales, demasiados falsos positivos. Mantener 72h.

### Comparación de thresholds alternativos

**`single_bidder`:**
- 60% actual → 1,458 pares
- 40% propuesto → 1,840 pares (+382)
- 25% → 2,206 pares

**`short_deadline`:**
- <72h actual → 1,428 pares
- <7 días → 4,408 pares
- <15 días → 5,420 pares (demasiado)

**`award_gap`:**
- 85% actual → 106 compradores (71% de pares)
- 60% propuesto → 206 compradores
- 40% → 277 compradores

### Cambios recomendados en `001_alert_pairs_view.sql`

| Señal | Cambio | Razón |
|-------|--------|-------|
| `award_gap` | 85% → 95% | Demasiados falsos positivos, no discrimina |
| `failed_tenders` | mínimo 20 → 10 procesos | Resucita la señal (actualmente solo 6 casos) |
| `short_deadline` | mantener 72h | Ya bien calibrado para Guatemala |
| `single_bidder` | mantener 60% | Razonable |
| `direct_purchase` | mantener 70% | Razonable |

### Referencia: Cardinal (Open Contracting Partnership)

Cardinal-rs es la librería oficial de OCP para calcular red flags sobre datos OCDS. Actualmente implementa ~11 indicadores (de 73 teóricos). Los relevantes para nosotros:

- **R003** — short submission period: threshold de 15 días (nosotros usamos 72h, más estricto y apropiado para GT)
- **R018** — single bid received: binario por proceso (nosotros usamos ratio acumulado por par, más robusto)
- **R048** — heterogeneous supplier: variedad de categorías de ítems (no tenemos equivalente, oportunidad futura)

**Conclusión sobre Cardinal:** no vale la pena integrarlo para el hackathon (1-2 días de trabajo de conversión JSONL, solo 11 indicadores implementados). Sí vale mencionarlo en el pitch como "referencia metodológica internacional" para dar credibilidad.
