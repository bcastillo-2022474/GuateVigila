'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { SITE } from '@/lib/constants/site'
import type { AlertDetail } from '@/lib/sdk/types'
import {
  buildAlertPageUrl,
  buildAlertShareImagePath,
} from '@/lib/alerts/share'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AlertShareKit {
  headline: string
  brief: string
  whySuspicious: string[]
  xPost: string
}

interface AlertShareButtonProps {
  alert: AlertDetail
}

function slugifyAlertId(alertId: string) {
  return alertId.replace(/[^a-zA-Z0-9_-]+/g, '-')
}

function buildFullCopyText(kit: AlertShareKit, pageUrl: string) {
  const reasons = kit.whySuspicious.map((reason) => `- ${reason}`).join('\n')
  return [
    kit.headline,
    '',
    kit.brief,
    '',
    'Por qué es sospechosa:',
    reasons,
    '',
    'Texto corto para X:',
    kit.xPost,
    '',
    pageUrl,
  ].join('\n')
}

export function AlertShareButton({ alert }: AlertShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [kit, setKit] = useState<AlertShareKit | null>(null)
  const [loadingKit, setLoadingKit] = useState(false)

  const origin = typeof window === 'undefined' ? SITE.url : window.location.origin
  const pageUrl = useMemo(() => buildAlertPageUrl(alert.id, origin), [alert.id, origin])
  const previewText = useMemo(
    () => (kit ? `${kit.xPost}\n\n${pageUrl}` : ''),
    [kit, pageUrl]
  )
  const summaryImagePath = useMemo(() => buildAlertShareImagePath(alert.id, 'summary'), [alert.id])
  const evidenceImagePath = useMemo(() => buildAlertShareImagePath(alert.id, 'evidence'), [alert.id])

  async function generatePreview() {
    try {
      setLoadingKit(true)

      const response = await fetch('/api/alerts/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alert.id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed')
      }

      setKit((await response.json()) as AlertShareKit)
    } catch (error) {
      console.error(error)
      toast.error('No se pudo generar la preview para X')
    } finally {
      setLoadingKit(false)
    }
  }

  function openComposer() {
    if (!kit) {
      toast.error('La preview todavía no está lista')
      return
    }

    const intent = new URL('https://twitter.com/intent/tweet')
    intent.searchParams.set('text', kit.xPost)
    intent.searchParams.set('url', pageUrl)
    window.open(intent.toString(), '_blank', 'noopener,noreferrer')
  }

  async function copyText() {
    if (!kit) {
      toast.error('La preview todavía no está lista')
      return
    }

    try {
      await navigator.clipboard.writeText(buildFullCopyText(kit, pageUrl))
      toast.success('Texto copiado')
    } catch {
      toast.error('No se pudo copiar el texto')
    }
  }

  async function downloadImage(path: string, label: string) {
    try {
      const response = await fetch(path)
      if (!response.ok) throw new Error('Failed')

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `guatevigila-${slugifyAlertId(alert.id)}-${label}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      URL.revokeObjectURL(url)
      toast.success('Visual descargado')
    } catch (error) {
      console.error(error)
      toast.error('No se pudo descargar la imagen')
    }
  }

  useEffect(() => {
    if (open && !kit && !loadingKit) {
      void generatePreview()
    }
  }, [open, kit, loadingKit])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
      >
        Compartir en X
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-none min-h-[70vh] max-h-[92vh] overflow-y-auto rounded-[28px] border border-border bg-background p-0 shadow-[0_32px_120px_rgba(0,0,0,0.38)] sm:w-[min(1120px,calc(100vw-2rem))] sm:max-w-none gap-0">
          <DialogHeader className="px-6 pt-6 pb-0 text-left">
            <DialogTitle>Compartir en X</DialogTitle>
            <DialogDescription>
              Revisa la preview exacta del post, abre el composer de X con el texto precargado y adjunta las visuales si quieres enriquecer el post.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            <div className="lg:col-span-5 border-b lg:border-b-0 lg:border-r border-border p-6 space-y-4 bg-muted/35">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Kit para X
                </p>
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={loadingKit}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {loadingKit ? 'Generando...' : 'Regenerar preview'}
                </button>
              </div>

              {kit ? (
                <>
                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Titular IA
                    </p>
                    <p className="mt-2 text-lg font-semibold text-foreground leading-snug">{kit.headline}</p>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{kit.brief}</p>
                  </div>

                  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Por qué es sospechosa
                    </p>
                    <div className="mt-3 space-y-2">
                      {kit.whySuspicious.map((reason) => (
                        <p key={reason} className="text-sm text-muted-foreground leading-relaxed">
                          • {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
                  {loadingKit ? 'Generando preview con IA...' : 'La preview todavía no está lista.'}
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground leading-relaxed shadow-sm">
                Esta versión no usa la API paga de X. El texto y el link se pasan al composer oficial de X; si quieres imágenes, descárgalas aquí y adjúntalas manualmente en el post.
              </div>
            </div>

            <div className="lg:col-span-7 p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Preview del post
                </p>
                <button
                  type="button"
                  onClick={generatePreview}
                  disabled={loadingKit}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  {loadingKit ? 'Generando...' : 'Regenerar preview'}
                </button>
              </div>

              <div className="rounded-[28px] border border-border bg-[#0f1419] text-white overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
                <div className="p-5 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold">
                      GV
                    </div>
                    <div>
                      <p className="font-semibold leading-none">GuateVigila</p>
                      <p className="text-xs text-white/55 leading-none mt-1">@guatevigila</p>
                    </div>
                  </div>
                  <div className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-white/95">
                    {kit ? previewText : 'Generando texto para X...'}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10">
                  <img
                    src={summaryImagePath}
                    alt="Preview visual resumen"
                    className="block w-full h-auto bg-black"
                  />
                  <img
                    src={evidenceImagePath}
                    alt="Preview visual evidencia"
                    className="block w-full h-auto bg-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => downloadImage(summaryImagePath, 'resumen')}
                  className="border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Descargar visual 1
                </button>
                <button
                  type="button"
                  onClick={() => downloadImage(evidenceImagePath, 'evidencia')}
                  className="border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Descargar visual 2
                </button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-5 border-t border-border bg-muted/45">
            <button
              type="button"
              onClick={copyText}
              disabled={!kit}
              className="border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              Copiar texto
            </button>
            <button
              type="button"
              onClick={openComposer}
              disabled={!kit}
              className="bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-zinc-800 disabled:opacity-50"
            >
              Abrir en X
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
