import { z } from 'zod'
import { minimaxChat } from '@/lib/ai/minimax'
import { client } from '@/lib/sdk/client'

const AlertShareRequestSchema = z.object({
  alertId: z.string().min(1),
})

const AlertShareResponseSchema = z.object({
  headline: z.string().min(1),
  brief: z.string().min(1),
  whySuspicious: z.array(z.string().min(1)).min(2).max(3),
  xPost: z.string().min(1),
})

function extractJsonObject(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]
  const candidate = fenced ?? raw
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')

  if (start === -1 || end === -1 || end < start) {
    throw new Error('MiniMax no devolvió JSON válido')
  }

  return JSON.parse(candidate.slice(start, end + 1))
}

function trimToLength(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value.trim()
  return `${value.slice(0, maxLength - 1).trimEnd()}…`
}

export async function POST(req: Request) {
  try {
    const parsedBody = AlertShareRequestSchema.safeParse(await req.json())
    if (!parsedBody.success) {
      return Response.json({ error: 'El alertId es requerido' }, { status: 400 })
    }

    const alert = await client.getAlertById(parsedBody.data.alertId)
    if (!alert) {
      return Response.json({ error: 'La alerta no existe' }, { status: 404 })
    }

    const signalSummary = alert.signals
      .map(
        (signal) =>
          `- ${signal.description}: ${signal.title} (${signal.metrics
            .map((metric) => `${metric.value} ${metric.label}`)
            .join(', ')})`
      )
      .join('\n')

    const completion = await minimaxChat({
      messages: [
        {
          role: 'system',
          content:
            'Eres editor de una redacción de periodismo de datos en Guatemala. Redactas publicaciones para X con tono preciso, verificable y con gancho periodístico, sin caer en afirmaciones legales concluyentes.',
        },
        {
          role: 'user',
          content: `
Devuelve SOLO JSON válido con esta forma exacta:
{
  "headline": "string",
  "brief": "string",
  "whySuspicious": ["string", "string", "string"],
  "xPost": "string"
}

Reglas:
- "headline": máximo 70 caracteres, fuerte pero sobrio.
- "brief": 2 frases, máximo 240 caracteres, resume el hallazgo y por qué amerita revisión.
- "whySuspicious": 2 o 3 razones concretas, cada una máximo 90 caracteres.
- "xPost": máximo 240 caracteres, sin URL, listo para abrir en X.
- Nunca afirmes delitos como hechos. Usa lenguaje como señal de riesgo, patrón atípico, concentración, falta de competencia u opacidad contractual.
- No uses markdown, ni comillas exteriores, ni explicaciones. Solo JSON.

Caso:
Entidad: ${alert.entityName}
Proveedor: ${alert.involvedSupplier.name}
NIT: ${alert.involvedSupplier.nit}
Monto adjudicado: Q${alert.involvedSupplier.totalAwarded.toLocaleString('es-GT')}
Score de riesgo: ${alert.riskScore}/100
Descripción de la alerta: ${alert.description}

Señales activas:
${signalSummary}
          `.trim(),
        },
      ],
      temperature: 0.8,
      maxCompletionTokens: 900,
    })

    const parsedShare = AlertShareResponseSchema.parse(extractJsonObject(completion.text))

    return Response.json({
      headline: trimToLength(parsedShare.headline, 70),
      brief: trimToLength(parsedShare.brief, 240),
      whySuspicious: parsedShare.whySuspicious.slice(0, 3).map((reason) => trimToLength(reason, 90)),
      xPost: trimToLength(parsedShare.xPost, 240),
    })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'No se pudo generar el kit para X' }, { status: 500 })
  }
}
