import type { AlertDetail } from '@/lib/sdk/types'
import { minimaxChat } from '@/lib/ai/minimax'

interface DraftRequestBody {
  alert: AlertDetail
}

export async function POST(req: Request) {
  try {
    const { alert } = (await req.json()) as DraftRequestBody

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
            'Eres un periodista de investigación guatemalteco especializado en contratación pública.',
        },
        {
          role: 'user',
          content: `Escribe un párrafo de apertura de 100-130 palabras para una nota periodística basada en los siguientes datos de Guatecompras.

No acuses ni afirmes que hubo corrupción.

Presenta los hechos y el patrón estadístico detectado con tono periodístico directo.

No uses frases como "según los datos" o "de acuerdo a".

Empieza directamente con el hallazgo.

Entidad compradora:
${alert.entityName}

Proveedor involucrado:
${alert.involvedSupplier.name}

NIT:
${alert.involvedSupplier.nit}

Monto total adjudicado:
Q${alert.involvedSupplier.totalAwarded.toLocaleString('es-GT')}

Señales detectadas:
${signalSummary}`,
        },
      ],
      temperature: 0.7,
      maxCompletionTokens: 1024,
    })

    return Response.json({ draft: completion.text })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'No se pudo generar el borrador' },
      { status: 500 }
    )
  }
}
