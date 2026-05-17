import type { AlertDetail } from '@/lib/sdk/types'

interface DraftRequestBody {
  alert: AlertDetail
}

interface MiniMaxCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: 'MINIMAX_API_KEY no configurada' },
        { status: 500 }
      )
    }

    const { alert } = (await req.json()) as DraftRequestBody

    const signalSummary = alert.signals
      .map(
        (signal) =>
          `- ${signal.description}: ${signal.title} (${signal.metrics
            .map((metric) => `${metric.value} ${metric.label}`)
            .join(', ')})`
      )
      .join('\n')

    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2',
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
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MiniMax draft generation failed:', response.status, errorText)
      return Response.json({ error: 'No se pudo generar el borrador' }, { status: 500 })
    }

    const completion = (await response.json()) as MiniMaxCompletionResponse
    const raw = completion.choices?.[0]?.message?.content ?? ''
    const thinkEnd = raw.indexOf('</think>')
    const draft = thinkEnd !== -1 ? raw.slice(thinkEnd + 8).trim() : raw.trim()

    return Response.json({ draft })
  } catch (error) {
    console.error(error)

    return Response.json(
      { error: 'No se pudo generar el borrador' },
      { status: 500 }
    )
  }
}
