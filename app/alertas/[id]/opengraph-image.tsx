import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import { SITE } from '@/lib/constants/site'

export const runtime = 'nodejs'
export const alt = 'Alerta Pericial — GuateVigila'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Pertenencia cromática de alta definición
const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#ef4444', text: '#ffffff', label: 'RIESGO CRÍTICO' },
  high:     { bg: '#f97316', text: '#ffffff', label: 'RIESGO ALTO' },
  medium:   { bg: '#f59e0b', text: '#ffffff', label: 'RIESGO MEDIO' },
  low:      { bg: '#10b981', text: '#ffffff', label: 'RIESGO BAJO' },
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alert = await client.getAlertById(id)

  const risk = RISK_COLORS[alert?.riskLevel ?? 'low']
  const entityName = alert?.entityName ?? 'Entidad Gubernamental'
  const supplierName = alert?.involvedSupplier?.name ?? ''
  const riskScore = alert?.riskScore ?? 0
  const signalCount = alert?.signals?.length ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b', // Fondo zinc-950 OSINT
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Barra superior de acento dinámico según riesgo */}
        <div style={{ width: '100%', height: 8, background: risk.bg, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '56px 72px' }}>
          
          {/* Fila del encabezado */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.5px' }}>
                GuateVigila
              </div>
              <div style={{ fontSize: 22, color: '#3f3f46', paddingBottom: 2 }}>/</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: '#a1a1aa' }}>Dictamen de Alerta</div>
            </div>
            <div style={{
              background: risk.bg,
              color: risk.text,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.15em',
              padding: '8px 20px',
              borderRadius: 6,
              display: 'flex',
            }}>
              {risk.label}
            </div>
          </div>

          {/* Nombre de la entidad pública */}
          <div style={{
            fontSize: entityName.length > 50 ? 38 : 48,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 1000,
          }}>
            {entityName}
          </div>

          {/* Contratista implicado */}
          {supplierName && (
            <div style={{ fontSize: 24, color: '#a1a1aa', fontWeight: 500, marginBottom: 40 }}>
              Contratista Relacionado: <span style={{ color: '#e4e4e7', fontWeight: 700 }}>{supplierName}</span>
            </div>
          )}

          {/* Panel de estadísticas métricas */}
          <div style={{ display: 'flex', gap: 64, marginTop: 'auto', background: '#18181b', padding: '28px 48px', borderRadius: 16, border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                Score de Riesgo
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: risk.bg, lineHeight: 1 }}>
                {riskScore}<span style={{ fontSize: 22, color: '#71717a', fontWeight: 400 }}>/100</span>
              </div>
            </div>
            
            <div style={{ width: 1, background: '#27272a', display: 'flex' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                Señales Activas
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>
                {signalCount}
              </div>
            </div>
            
            <div style={{ width: 1, background: '#27272a', display: 'flex' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 13, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
                Procedencia
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#ffffff', lineHeight: 1, marginTop: 10 }}>
                Guatecompras OCDS
              </div>
            </div>
          </div>
        </div>

        {/* Barra de cierre institucional */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 72px',
          borderTop: '1px solid #27272a',
          background: '#0c0c0e',
        }}>
          <div style={{ fontSize: 14, color: '#71717a', fontFamily: 'monospace' }}>{SITE.url}</div>
          <div style={{ fontSize: 14, color: '#71717a', fontWeight: 500 }}>Monitoreo e Inferencia de Contrataciones Públicas</div>
        </div>
      </div>
    ),
    { ...size }
  )
}