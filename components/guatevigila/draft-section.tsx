'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import type { AlertDetail } from '@/lib/sdk/types'

interface DraftSectionProps {
  alert: AlertDetail
}

export function DraftSection({
  alert,
}: DraftSectionProps) {
  const [draft, setDraft] = useState(
    alert.draftInvestigation
  )

  const [loading, setLoading] =
    useState(false)

  async function generateDraft() {
    try {
      setLoading(true)

      const response = await fetch(
        '/api/draft',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            alert,
          }),
        }
      )

      if (!response.ok) {
        throw new Error('Failed')
      }

      const data =
        await response.json()

      setDraft(data.draft)

      toast.success(
        'Borrador generado'
      )
    } catch (error) {
      toast.error(
        'No se pudo generar el borrador'
      )
    } finally {
      setLoading(false)
    }
  }

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(
        draft
      )

      toast.success(
        'Copiado al portapapeles'
      )
    } catch {
      toast.error(
        'No se pudo copiar'
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generateDraft}
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2 text-xs font-semibold flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined filled text-lg">auto_awesome</span>
          {loading ? 'Generando...' : 'Generar borrador periodístico'}
        </button>

        <button
          onClick={copyDraft}
          disabled={!draft}
          className="border border-outline-variant px-6 py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors disabled:opacity-40"
        >
          Copiar al portapapeles
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full min-h-[260px] border border-outline-variant bg-surface-container-lowest p-4 text-sm text-on-surface leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  )
}
