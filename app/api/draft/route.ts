import OpenAI from 'openai'

export async function POST(req: Request) {
    const minimax = new OpenAI({
        apiKey: process.env.MINIMAX_API_KEY,
        baseURL: 'https://api.minimax.io/v1',
    })
    try {
        const { alert } = await req.json()

        const signalSummary = alert.signals
            .map(
                (s: any) =>
                    `- ${s.description}: ${s.title} (${s.metrics
                        .map(
                            (m: any) =>
                                `${m.value} ${m.label}`
                        )
                        .join(', ')})`
            )
            .join('\n')

        const completion =
            await minimax.chat.completions.create({
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
            })

        const raw = completion.choices[0]?.message?.content ?? ''
        const thinkEnd = raw.indexOf('</think>')
        const draft = thinkEnd !== -1 ? raw.slice(thinkEnd + 8).trim() : raw.trim()

        return Response.json({
            draft,
        })
    } catch (error) {
        console.error(error)

        return Response.json(
            {
                error:
                    'No se pudo generar el borrador',
            },
            {
                status: 500,
            }
        )
    }
}

