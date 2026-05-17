import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import { SITE } from '@/lib/constants/site'

export const runtime = 'nodejs'
export const alt = 'Alerta de riesgo — GuateVigila'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const RISK_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: '#ba1a1a', text: '#ffffff', label: 'RIESGO CRÍTICO' },
  high:     { bg: '#b84d00', text: '#ffffff', label: 'RIESGO ALTO' },
  medium:   { bg: '#795548', text: '#ffffff', label: 'RIESGO MEDIO' },
  low:      { bg: '#2e7d32', text: '#ffffff', label: 'RIESGO BAJO' },
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alert = await client.getAlertById(id)

  const risk = RISK_COLORS[alert?.riskLevel ?? 'low']
  const entityName = alert?.entityName ?? 'Entidad desconocida'
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
          background: '#111315',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div style={{ width: '100%', height: 6, background: risk.bg, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Logo text */}
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e3e2e6', letterSpacing: '-0.5px' }}>
                GuateVigila
              </div>
            </div>
            <div style={{
              background: risk.bg,
              color: risk.text,
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: '0.12em',
              padding: '6px 16px',
              display: 'flex',
            }}>
              {risk.label}
            </div>
          </div>

          {/* Entity name */}
          <div style={{
            fontSize: entityName.length > 50 ? 36 : 44,
            fontWeight: 800,
            color: '#e3e2e6',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 900,
          }}>
            {entityName}
          </div>

          {/* Supplier */}
          {supplierName && (
            <div style={{ fontSize: 22, color: '#8e9199', marginBottom: 40 }}>
              Proveedor: {supplierName}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 32, marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Score de Riesgo
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: risk.bg, lineHeight: 1 }}>
                {riskScore}<span style={{ fontSize: 20, color: '#8e9199' }}>/100</span>
              </div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Señales Activas
              </div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#e3e2e6', lineHeight: 1 }}>
                {signalCount}
              </div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Fuente
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e3e2e6', lineHeight: 1, marginTop: 8 }}>
                Guatecompras OCDS
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 64px',
          borderTop: '1px solid #2a2d30',
        }}>
          <div style={{ fontSize: 14, color: '#8e9199' }}>{SITE.url}</div>
          <div style={{ fontSize: 14, color: '#8e9199' }}>Monitoreo de Contrataciones Públicas · Guatemala</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
