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
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium transition duration-200 hover:bg-primary/90 disabled:opacity-50"
        >
          {loading
            ? 'Generando...'
            : 'Generar borrador periodístico'}
        </button>

        <button
          onClick={copyDraft}
          disabled={!draft}
          className="px-4 py-2 rounded-lg border border-border text-sm font-medium transition duration-200 hover:bg-muted hover:text-muted-foreground disabled:opacity-50"
        >
          Copiar al portapapeles
        </button>
      </div>

      <textarea
        value={draft}
        onChange={(e) =>
          setDraft(e.target.value)
        }
        className="w-full min-h-[260px] rounded-xl border border-border bg-background p-4 text-sm"
      />
    </div>
  )
}
