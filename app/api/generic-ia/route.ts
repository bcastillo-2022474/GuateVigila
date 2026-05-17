interface GenericAIRequestBody {
  systemPrompt?: string
  userPrompt: string
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

    const { systemPrompt, userPrompt } = (await req.json()) as GenericAIRequestBody

    if (!userPrompt) {
      return Response.json(
        { error: 'El campo userPrompt es requerido' },
        { status: 400 }
      )
    }

    const messages = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: userPrompt })

    const response = await fetch('https://api.minimax.io/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2',
        messages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MiniMax generation failed:', response.status, errorText)
      return Response.json({ error: 'No se pudo generar el texto de la IA' }, { status: 500 })
    }

    const completion = (await response.json()) as MiniMaxCompletionResponse
    const raw = completion.choices?.[0]?.message?.content ?? ''
    
    const thinkEnd = raw.indexOf('</think>')
    const textResult = thinkEnd !== -1 ? raw.slice(thinkEnd + 8).trim() : raw.trim()

    return Response.json({ text: textResult })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}