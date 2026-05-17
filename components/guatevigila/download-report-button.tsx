'use client'

import { useState } from 'react'
import { pdf } from '@react-pdf/renderer'
import { AlertReport, AlertReportData } from '@/components/guatevigila/alert.report'

type DownloadReportButtonProps = {
    alert: any
}

export function DownloadReportButton({ alert }: DownloadReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleDownload = async () => {
        setIsGenerating(true)
        try {
            const signalSummary = (alert.signals ?? [])
                .map((signal: any) =>
                    `- [${signal.title}]: ${signal.description} (${(signal.metrics ?? [])
                        .map((m: any) => `${m.value} ${m.label}`)
                        .join(', ')})`
                )
                .join('\n')

            // OPTIMIZACIÓN: Cambiamos a un rol analítico y estructurado
            const systemPrompt = "Eres un analista forense experto en auditoría pública y detección de redes de corrupción corporativa."

            const userPrompt = `
Genera un análisis técnico y objetivo para un Reporte de Alerta Institucional basado en los siguientes datos de contratación.

Estructura tu respuesta exactamente en estos 3 puntos (usa saltos de línea para separarlos):
1. RESUMEN EJECUTIVO: Describe el hallazgo principal en un tono frío, técnico y directo.
2. ANÁLISIS DEL PATRÓN: Explica la relación entre las señales de alerta detectadas y el volumen de adjudicación.
3. CONCLUSIÓN: Propón una recomendación de investigación o curso de acción preventiva.

Restricciones: No uses terminología legal concluyente como "corrupción" o "fraude". Habla de "anomalías", "patrones atípicos" o "concentración de riesgo". Evita introducciones vacías como "A continuación se presenta...".

Entidad Compradora: ${alert.entityName}
Proveedor: ${alert.involvedSupplier?.name ?? 'N/A'} (NIT: ${alert.involvedSupplier?.nit ?? 'N/A'})
Monto Total: Q${(alert.involvedSupplier?.totalAwarded ?? 0).toLocaleString('es-GT')}
Contratos: ${alert.contracts ?? 0}
Score de Riesgo: ${alert.riskScore ?? 0}/100

Señales detectadas:
${signalSummary}
            `.trim()

            const response = await fetch('/api/generic-ia', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ systemPrompt, userPrompt }),
            })

            if (!response.ok) throw new Error("Error en la respuesta de la IA")

            const data = await response.json()
            const textFromAI = data.text ?? 'No se pudo generar el análisis.'

            const reportData: AlertReportData = {
                id: alert.id,
                entityName: alert.entityName,
                riskLevel: alert.riskLevel,
                riskScore: alert.riskScore ?? 0,
                totalAmount: alert.involvedSupplier?.totalAwarded ?? 0,
                contracts: alert.contracts ?? 0, 
                supplier: {
                    name: alert.involvedSupplier?.name ?? 'N/A',
                    nit: alert.involvedSupplier?.nit ?? 'N/A',
                },
                signals: (alert.signals ?? []).map((signal: any) => ({
                    title: signal.title,
                    description: signal.description,
                    severity: alert.riskLevel ?? 'Media',
                })),
                aiAnalysis: textFromAI,
                // Simulamos un historial para pruebas si viene vacío, asegúrate de mapear el tuyo real
                yearlyHistory: alert.yearlyHistory?.length ? alert.yearlyHistory : [
                    { year: 2023, amount: (alert.involvedSupplier?.totalAwarded ?? 0) * 0.3 },
                    { year: 2024, amount: (alert.involvedSupplier?.totalAwarded ?? 0) * 0.5 },
                    { year: 2025, amount: (alert.involvedSupplier?.totalAwarded ?? 0) * 0.2 },
                ],
            }

            const blob = await pdf(<AlertReport alert={reportData} />).toBlob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `reporte-${alert.id}.pdf`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

        } catch (error) {
            console.error(error)
            alert("Ocurrió un error generando el PDF.")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md text-white transition ${
                isGenerating ? 'bg-zinc-500 cursor-not-allowed' : 'bg-zinc-900 hover:bg-zinc-800'
            }`}
        >
            {isGenerating ? 'Generando PDF...' : 'Descargar reporte'}
        </button>
    )
}