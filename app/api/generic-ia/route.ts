import { minimaxChat, type MiniMaxChatMessage } from '@/lib/ai/minimax'

interface GenericAIRequestBody {
  systemPrompt?: string
  userPrompt: string
}

export async function POST(req: Request) {
  try {
    const { systemPrompt, userPrompt } = (await req.json()) as GenericAIRequestBody

    if (!userPrompt) {
      return Response.json(
        { error: 'El campo userPrompt es requerido' },
        { status: 400 }
      )
    }

    const messages: MiniMaxChatMessage[] = []
    
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    
    messages.push({ role: 'user', content: userPrompt })

    const completion = await minimaxChat({
      messages,
      temperature: 0.7,
      maxCompletionTokens: 1024,
    })

    return Response.json({ text: completion.text })
  } catch (error) {
    console.error(error)
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
