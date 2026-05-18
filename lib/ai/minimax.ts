export interface MiniMaxChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

interface MiniMaxCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  model?: string
}

interface MiniMaxChatOptions {
  messages: MiniMaxChatMessage[]
  temperature?: number
  maxCompletionTokens?: number
  model?: string
}

const MINIMAX_API_URL = 'https://api.minimax.io/v1/chat/completions'
const DEFAULT_MINIMAX_MODEL = process.env.MINIMAX_MODEL?.trim() || 'MiniMax-M2.7'

export function stripMiniMaxThinking(content: string): string {
  const thinkEnd = content.indexOf('</think>')
  return thinkEnd !== -1 ? content.slice(thinkEnd + 8).trim() : content.trim()
}

export async function minimaxChat({
  messages,
  temperature = 0.7,
  maxCompletionTokens = 1024,
  model = DEFAULT_MINIMAX_MODEL,
}: MiniMaxChatOptions) {
  const apiKey = process.env.MINIMAX_API_KEY
  if (!apiKey) {
    throw new Error('MINIMAX_API_KEY no configurada')
  }

  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_completion_tokens: maxCompletionTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('MiniMax generation failed:', response.status, errorText)
    throw new Error('No se pudo generar el texto con MiniMax')
  }

  const completion = (await response.json()) as MiniMaxCompletionResponse
  const raw = completion.choices?.[0]?.message?.content ?? ''

  return {
    raw,
    text: stripMiniMaxThinking(raw),
    model: completion.model ?? model,
  }
}
