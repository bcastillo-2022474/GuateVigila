# GuateVigila — Logo Generation Prompt

## Contexto de identidad

- **Paleta:** blanco puro (#FAFAFA) sobre negro casi puro (#1A1C1E), sin saturación. Único acento: rojo oscuro (#BA1A1A) usado exclusivamente para alertas críticas.
- **Tipografía:** Inter — geométrica, sin serif, peso bold/semibold. Sin ornamentos.
- **Tono:** austero, institucional, serio. No es una startup — es una herramienta cívica de vigilancia de datos públicos.
- **Concepto del producto:** detecta patrones de riesgo en contrataciones públicas de Guatemala cruzando datos masivos. Vigilancia + datos + transparencia.

---

## Prompt principal (Midjourney / Ideogram)

```
Minimal logo mark for a civic data transparency platform called "GuateVigila".

Concept: combine a geometric eye (simple, open, no eyelashes) with a node from a network graph or a data grid intersection point — suggesting both surveillance and data analysis.

Style: stark, geometric, monochrome. Pure black (#1A1C1E) on white. No gradients, no shadows, no color fills. Flat vector aesthetic. The mark should read clearly at 32x32px as a favicon.

Do NOT include text. Logomark only.

Think: ICIJ logo meets Palantir icon — civic, data-driven, serious.

Negative space usage is encouraged. Single closed shape preferred over multiple disconnected elements.
```

---

## Variante con acento rojo (para la versión color)

```
Same as above but: the iris or center point of the eye shape is filled with deep red (#BA1A1A). Everything else remains black on white. The red dot should feel like a data alert indicator, not decorative.
```

---

## Para la OG image (1200×630)

```
Horizontal banner, dark background (#1A1C1E). Left side: the GuateVigila logomark in white. Right side: wordmark "GuateVigila" in Inter Bold, white, large. Below the wordmark: tagline "Monitoreo de Contrataciones Públicas · Guatemala" in Inter Regular, small, color #888.

No photography. No illustrations beyond the mark. Grid of faint dots in the background (opacity 5%). Minimalist, editorial.
```

---

## Herramientas recomendadas

| Herramienta | Por qué | Acceso |
|---|---|---|
| **Midjourney** | Mejor control de forma geométrica y estilo minimalista | Discord, plan de pago |
| **Ideogram** | Maneja bien texto + logo, gratis | ideogram.ai |
| **Recraft** | Exporta SVG directo, bueno para logos geométricos | recraft.ai, gratis |

> **Tip:** En Recraft podés pegar el prompt y pedir el resultado en SVG — ahorra el paso de vectorizar manualmente.

---

## Assets a generar

- `public/favicon.ico` — 32×32 y 16×16
- `public/logo-192.png` — 192×192 (PWA)
- `public/logo-512.png` — 512×512 (PWA)
- `public/apple-touch-icon.png` — 180×180
- `public/opengraph-image.png` — 1200×630
