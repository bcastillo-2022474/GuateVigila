# GuateVigila

Herramienta de detección automática de patrones de riesgo en contratación pública guatemalteca. Procesa los datos OCDS de Guatecompras (2020–2024) y genera alertas sobre pares entidad/proveedor con comportamiento estadísticamente anómalo.

Construido para [hack@latam](https://hacklatam.com) — Transparency & Corruption track.

---

## Qué hace

GuateVigila detecta cinco señales de riesgo sobre los datos de Guatecompras:

1. **Proveedor único recurrente** — empresa que gana ≥60% de contratos con una entidad siendo el único oferente
2. **Licitaciones de plazo imposible** — procesos con ventana de oferta menor a 72 horas
3. **Abuso de compra directa** — entidades donde >70% de adjudicaciones evitan licitación abierta (promedio nacional: ~31%)
4. **Gap adjudicación sin contrato** — entidades con ≥85% de adjudicaciones que nunca formalizan contrato
5. **Tasa anómala de desiertos** — entidades donde ≥50% de concursos quedan desiertos o se cancelan (promedio nacional: ~26%)

Cada combinación de señales genera una alerta con score de riesgo 0–100. Las alertas incluyen links directos a Guatecompras y al Registro Mercantil, y un borrador de contexto periodístico generado con IA.

---

## Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS, TypeScript
- **Base de datos:** DuckDB sobre CSV OCDS — consultas SQL directas sobre los archivos, sin ETL
- **Deploy:** Vercel
- **IA:** MiniMax API (borradores periodísticos on-demand)

---

## Estructura del proyecto

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
├── components/guatevigila/     # Componentes de UI
├── lib/
│   ├── db.ts                   # Cliente DuckDB (singleton, lazy init)
│   └── sdk/
│       ├── client.ts           # Punto de entrada — objeto `client`
│       ├── queries/            # Una función por recurso
│       │   ├── alerts.ts
│       │   ├── entities.ts
│       │   ├── suppliers.ts
│       │   └── stats.ts
│       └── types.ts
```

Toda la lógica de datos vive en `lib/sdk/queries/`. Los Server Components llaman `client.getEntityById(id)` — sin fetch HTTP, sin API routes, sin ORM.

---

## Requisitos

- Node.js 20+
- pnpm
- Los CSV del OCDS Guatemala (ver abajo)

---

## Setup

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/bcastillo-2022474/guate-vigila
cd guate-vigila
pnpm install
```

### 2. Descargar los datos

Los datos provienen de Guatecompras vía el portal OCDS del Ministerio de Finanzas:

```
https://datos.minfin.gob.gt/dataset/ocds-guatecompras
```

Descarga los CSV del año que necesitas (el proyecto usa 2024 por defecto) y colócalos en una carpeta local. Cada año incluye varios archivos: `main.csv`, `awards.csv`, `awards_suppliers.csv`, `contracts.csv`, etc.

### 3. Configurar la ruta de datos

En `lib/db.ts`, actualiza `DATA_DIR` con la ruta a tu carpeta de CSV:

```ts
const DATA_DIR = '/ruta/a/tu/carpeta/2024'
```

### 4. Correr en desarrollo

```bash
pnpm dev
```

La primera request carga todos los CSV en DuckDB en memoria — tarda ~10–30 segundos dependiendo del hardware. Las requests siguientes usan la conexión ya inicializada.

---

## Variables de entorno

```bash
# .env.local
MINIMAX_API_KEY=...   # para generación de borradores periodísticos
```

---

## Datos

- **Fuente:** OCDS Guatecompras, publicado por el Ministerio de Finanzas de Guatemala
- **Licencia:** CC BY 4.0
- **Cobertura actual:** 2024 (el schema soporta cualquier año en el mismo formato)
- **Problemas conocidos del dataset:**
  - Fechas con año `0001` en `tender_tenderPeriod_endDate` → filtradas con `WHERE year > 2000`
  - `procurementMethod` siempre es `open` → se usa `procurementMethodDetails` en su lugar
  - `bids_details.value_amount` siempre es `0.0` → se usa `tender_numberOfTenderers`

---

## Licencia

MIT — datos OCDS Guatecompras bajo CC BY 4.0.
