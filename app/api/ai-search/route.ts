import { client } from '@/lib/sdk/client'

interface AIMatch {
  type: 'entity' | 'supplier' | 'alert'
  id: string
  title: string
  subtitle: string
  matchReason: string
  relevanceScore: number
  riskLevel?: 'critical' | 'high' | 'medium' | 'low'
  amount?: number
  signalType?: string
}

interface AISearchResponse {
  brief: string
  matches: AIMatch[]
  queryInterpretation: string
}

interface MiniMaxMessageResponse {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
}

const MINIMAX_MODEL = 'MiniMax-M2'
const MINIMAX_API_URL = 'https://api.minimax.io/v1/chat/completions'

function cleanAIResponse(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/think>/gi, '')
    .replace(/<think>/gi, '')
    .trim()
}

function compactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return `Q${Math.round(amount).toLocaleString('es-GT')}`
}

async function minimaxChat(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
  temperature: number = 0.3,
  maxTokens: number = 512
): Promise<string> {
  const response = await fetch(MINIMAX_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`MiniMax API error: ${response.status} - ${errorText}`)
  }

  const completion = (await response.json()) as MiniMaxMessageResponse
  const raw = completion.choices?.[0]?.message?.content ?? ''
  return cleanAIResponse(raw)
}

async function interpretQuery(
  query: string,
  apiKey: string
): Promise<{ interpretation: string; searchTerms: string[]; intent: string; filters: { entity?: string; supplier?: string; signal?: string; riskLevel?: string } }> {
  try {
    const raw = await minimaxChat(
      [
        {
          role: 'system',
          content: `Eres un asistente de análisis de datos de contratación pública guatemalteca.
Tu trabajo es interpretar preguntas del usuario y convertirlas en criterios de búsqueda.

Devuelve SOLO un objeto JSON válido (sin markdown, sin código, sin explicaciones):
{
  "interpretation": "texto claro de lo que el usuario quiere buscar",
  "searchTerms": ["término1", "término2"],
  "intent": "top_suppliers | top_entities | alerts | general | off_topic",
  "filters": {
    "entity": "nombre de entidad a buscar (o null)",
    "supplier": "nombre de proveedor a buscar (o null)",
    "signal": "tipo de señal: single_bidder, short_deadline, direct_purchase, award_gap, failed_tenders (o null)",
    "riskLevel": "critical, high, medium, low (o null)"
  }
}

Ejemplos:
- "proveedores con más contratos" → {"interpretation": "Buscar proveedores con mayor volumen de contratación", "searchTerms": ["proveedor", "contratos", "adjudicaciones"], "intent": "top_suppliers", "filters": {"entity": null, "supplier": null, "signal": null, "riskLevel": null}}
- "top entidades por monto" → {"interpretation": "Entidades con mayor monto total adjudicado", "searchTerms": ["entidad", "monto", "adjudicaciones"], "intent": "top_entities", "filters": {"entity": null, "supplier": null, "signal": null, "riskLevel": null}}
- "alertas críticas del Ministerio de Salud" → {"interpretation": "Alertas críticas de la entidad Ministerio de Salud", "searchTerms": ["Ministerio de Salud", "alertas"], "intent": "alerts", "filters": {"entity": "Ministerio de Salud", "supplier": null, "signal": null, "riskLevel": "critical"}}
- "hola" → {"interpretation": "Saludo sin relación a contratación pública", "searchTerms": [], "intent": "off_topic", "filters": {}}
- "qué tiempo hace" → {"interpretation": "Consulta no relacionada con contratación pública", "searchTerms": [], "intent": "off_topic", "filters": {}}`,
        },
        { role: 'user', content: query },
      ],
      apiKey,
      0.3,
      512
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Query interpretation error:', error)
    return {
      interpretation: query,
      searchTerms: query.split(' ').filter((t) => t.length > 2),
      intent: 'general',
      filters: {},
    }
  }
}

async function scoreAndRankMatchesWithAI(
  queryInterpretation: string,
  matches: AIMatch[],
  apiKey: string
): Promise<AIMatch[]> {
  if (matches.length === 0) return []

  try {
    const matchesList = matches
      .map((m, i) => `${i + 1}. [${m.type.toUpperCase()}] ${m.title} | Subtitle: ${m.subtitle} | Reason: ${m.matchReason} | Risk: ${m.riskLevel ?? 'unknown'} | Amount: ${m.amount ? compactCurrency(m.amount) : 'N/A'}`)
      .join('\n')

    const raw = await minimaxChat(
      [
        {
          role: 'system',
          content: `Eres un experto en análisis de relevancia de datos de contratación pública guatemalteca.
Tu trabajo es evaluar qué tan relevantes son los resultados encontrados para la búsqueda del usuario.

Devuelve SOLO un array JSON de números (sin markdown, sin código, sin explicaciones):
[score1, score2, score3, ...]

Cada score es un número de 0 a 100 que representa qué tan relevante es ese resultado para la búsqueda:
- 90-100: Muy relevante, exactamente lo que el usuario busca
- 70-89: Relevante, coincide bien con la búsqueda
- 50-69: Parcialmente relevante, relacionado pero no exacto
- 0-49: Poco relevante o no relevante

Considera:
1. Coincidencia semántica con la búsqueda
2. Nivel de riesgo (crítico > alto > medio > bajo)
3. Magnitud del monto (mayor monto = más relevancia típicamente)
4. Tipo de resultado (alertas son más accionables que entidades genéricas)

Orden de los resultados a evaluar:
${matchesList}`,
        },
        {
          role: 'user',
          content: `Búsqueda: "${queryInterpretation}"\n\nEvalúa la relevancia de cada resultado del 0 al 100.`,
        },
      ],
      apiKey,
      0.2,
      1024
    )

    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No array in response')

    const scores = JSON.parse(jsonMatch[0]) as number[]
    return matches.map((match, idx) => ({
      ...match,
      relevanceScore: Math.min(100, Math.max(0, scores[idx] ?? 50)),
    }))
  } catch (error) {
    console.error('AI scoring error:', error)
    return matches.map((m) => ({ ...m, relevanceScore: 50 }))
  }
}

async function generateBrief(
  queryInterpretation: string,
  matches: AIMatch[],
  apiKey: string
): Promise<string> {
  if (matches.length === 0) {
    return `No se encontraron resultados para "${queryInterpretation}". Intenta reformular tu búsqueda.`
  }

  try {
    const top5 = matches.slice(0, 5)
    const matchesSummary = top5
      .map((m, i) => `${i + 1}. [${m.type.toUpperCase()}] ${m.title}: ${m.matchReason} (Relevancia: ${m.relevanceScore}%)`)
      .join('\n')

    return await minimaxChat(
      [
        {
          role: 'system',
          content: `Eres un analista de datos de contratación pública guatemalteca.
Dado los resultados de una búsqueda, genera un resumen ejecutivo breve (2-3 oraciones) que explique qué se encontró y por qué es relevante para la investigación.
No hagas acusaciones. Sé factual y enfático en los hallazgos.
IMPORTANTE: Devuelve SOLO el texto del resumen, sin etiquetas XML como <think> o .`,
        },
        {
          role: 'user',
          content: `Búsqueda: "${queryInterpretation}"

Resultados encontrados (ordenados por relevancia):
${matchesSummary}

Genera un resumen ejecutivo breve en español que explique los hallazgos.`,
        },
      ],
      apiKey,
      0.5,
      500
    )
  } catch (error) {
    console.error('Brief generation error:', error)
    if (matches.length === 0) {
      return `No se encontraron resultados para tu búsqueda sobre "${queryInterpretation}".`
    }
    return `Se encontraron ${matches.length} resultados para tu búsqueda sobre "${queryInterpretation}". Revisa los resultados ordenados por relevancia más abajo.`
  }
}

async function enrichMatchReason(
  match: AIMatch,
  queryInterpretation: string,
  apiKey: string
): Promise<string> {
  try {
    const raw = await minimaxChat(
      [
        {
          role: 'system',
          content: `Eres un asistente de análisis de datos de contratación pública guatemalteca.
Dado un resultado de búsqueda y la consulta original, genera UNA sola frase que explique por qué este resultado es relevante para la búsqueda.
Sé muy breve y específico. Máximo 20 palabras.
IMPORTANTE: Devuelve SOLO la frase, sin etiquetas XML como <think> o .`,
        },
        {
          role: 'user',
          content: `Búsqueda: "${queryInterpretation}"

Resultado: [${match.type.toUpperCase()}] ${match.title}
Detalles: ${match.subtitle}

¿Por qué es relevante este resultado para la búsqueda?`,
        },
      ],
      apiKey,
      0.3,
      100
    )

    return raw.trim().slice(0, 150)
  } catch (error) {
    return match.matchReason
  }
}

async function fetchEntities(searchTerm: string | null): Promise<AIMatch[]> {
  try {
    const result = await client.getEntities({ q: searchTerm || undefined, page: 1 })
    if (!result?.entities?.length) return []

    return result.entities.slice(0, 15).map((entity) => ({
      type: 'entity' as const,
      id: entity.id,
      title: entity.name,
      subtitle: `${entity.totalContracts} contratos · ${compactCurrency(entity.totalAmount)} · ${entity.activeAlerts} alertas activas`,
      matchReason: `${entity.activeAlerts} alertas activas`,
      relevanceScore: 50,
      riskLevel: entity.riskLevel,
      amount: entity.totalAmount,
    }))
  } catch (error) {
    console.error('Entities fetch error:', error)
    return []
  }
}

async function fetchSuppliers(searchTerm: string | null, intent?: string): Promise<AIMatch[]> {
  try {
    let result

    if (intent === 'top_suppliers') {
      result = await client.getSuppliers({ page: 1, pageSize: 30 })
    } else {
      result = await client.getSuppliers({ q: searchTerm || undefined, page: 1, pageSize: 30 })
    }

    if (!result?.suppliers?.length) {
      if (searchTerm && intent !== 'top_suppliers') {
        result = await client.getSuppliers({ page: 1, pageSize: 30 })
      }
    }

    if (!result?.suppliers?.length) return []

    return result.suppliers.slice(0, 15).map((supplier) => ({
      type: 'supplier' as const,
      id: supplier.id,
      title: supplier.name,
      subtitle: `${supplier.totalContracts} contratos · ${compactCurrency(supplier.totalAwarded)} · ${supplier.clientEntities} entidades`,
      matchReason: `Q${(supplier.totalAwarded / 1_000_000).toFixed(0)}M en ${supplier.totalContracts} contratos`,
      relevanceScore: 50,
      riskLevel: supplier.riskLevel,
      amount: supplier.totalAwarded,
    }))
  } catch (error) {
    console.error('Suppliers fetch error:', error)
    return []
  }
}

async function fetchAlerts(filters: { entity?: string; signal?: string; riskLevel?: string }): Promise<AIMatch[]> {
  try {
    const result = await client.getAlertsPage({
      entity: filters.entity || undefined,
      signal: filters.signal || undefined,
      page: 1,
      pageSize: 50,
    })

    if (!result?.alerts?.length) return []

    const filtered = filters.riskLevel
      ? result.alerts.filter((a) => a.riskLevel === filters.riskLevel)
      : result.alerts

    return filtered.slice(0, 15).map((alert) => ({
      type: 'alert' as const,
      id: alert.id,
      title: alert.entityName,
      subtitle: `${alert.signalType} · ${alert.contractCount} contratos · ${alert.riskLevel}`,
      matchReason: `${alert.signalType} - ${alert.contractCount} contratos involucrados`,
      relevanceScore: 50,
      riskLevel: alert.riskLevel,
      amount: alert.totalAmount,
      signalType: alert.signalType,
    }))
  } catch (error) {
    console.error('Alerts fetch error:', error)
    return []
  }
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.MINIMAX_API_KEY
    if (!apiKey) {
      return Response.json({ error: 'MINIMAX_API_KEY no configurada' }, { status: 500 })
    }

    const { query } = await req.json() as { query: string }

    if (!query?.trim()) {
      return Response.json({ error: 'Query is required' }, { status: 400 })
    }

    const { interpretation, searchTerms, filters, intent } = await interpretQuery(query, apiKey)

    // Reject off-topic queries — don't dump random data
    if (intent === 'off_topic' || (!searchTerms.length && intent === 'general')) {
      return Response.json({
        brief: 'Esta herramienta responde consultas sobre contratación pública guatemalteca. Intentá preguntar por una entidad, proveedor o tipo de alerta específica.',
        matches: [],
        queryInterpretation: interpretation,
      })
    }

    const allMatches: AIMatch[] = []
    const fetchPromises: Promise<AIMatch[]>[] = []

    if (intent === 'top_suppliers') {
      fetchPromises.push(fetchSuppliers(null, 'top_suppliers'))
    } else if (intent === 'top_entities') {
      fetchPromises.push(fetchEntities(null))
    } else if (intent === 'alerts') {
      fetchPromises.push(fetchAlerts(filters))
    } else {
      fetchPromises.push(fetchEntities(searchTerms[0] || null))
      fetchPromises.push(fetchSuppliers(searchTerms[0] || null, intent || undefined))
      fetchPromises.push(fetchAlerts(filters))
    }

    const results = await Promise.all(fetchPromises)
    for (const result of results) {
      allMatches.push(...result)
    }

    const enrichedMatches = await Promise.all(
      allMatches.map((match) => enrichMatchReason(match, interpretation, apiKey))
    )

    const matchesWithReasons = allMatches.map((match, idx) => ({
      ...match,
      matchReason: enrichedMatches[idx] || match.matchReason,
    }))

    const scoredMatches = await scoreAndRankMatchesWithAI(interpretation, matchesWithReasons, apiKey)
    scoredMatches.sort((a, b) => b.relevanceScore - a.relevanceScore)

    const topMatches = scoredMatches.slice(0, 20)
    const brief = await generateBrief(interpretation, topMatches, apiKey)

    const response: AISearchResponse = {
      brief,
      matches: topMatches,
      queryInterpretation: interpretation,
    }

    return Response.json(response)
  } catch (error) {
    console.error('AI Search error:', error)
    return Response.json({ error: 'No se pudo procesar la búsqueda' }, { status: 500 })
  }
}
