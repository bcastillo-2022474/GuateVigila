import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import { SITE } from '@/lib/constants/site'

export const runtime = 'nodejs'
export const alt = 'Perfil de entidad — GuateVigila'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatAmount(n: number): string {
  if (n >= 1_000_000_000) return `Q${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Q${(n / 1_000_000).toFixed(0)}M`
  return `Q${n.toLocaleString('es-GT')}`
}

const RISK_COLOR: Record<string, string> = {
  critical: '#ba1a1a',
  high: '#b84d00',
  medium: '#795548',
  low: '#2e7d32',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entity = await client.getEntityById(decodeURIComponent(id))

  const name = entity?.name ?? 'Entidad'
  const shortName = entity?.shortName ?? ''
  const totalContracts = entity?.totalContracts ?? 0
  const totalAmount = entity?.totalAmount ?? 0
  const activeAlerts = entity?.activeAlerts ?? 0
  const directPct = entity?.directPurchasePercentage ?? 0

  const alertColor = activeAlerts > 0 ? '#ba1a1a' : '#2e7d32'

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
        }}
      >
        <div style={{ width: '100%', height: 6, background: '#1b6b3a', display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '48px 64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#e3e2e6', letterSpacing: '-0.5px' }}>
              GuateVigila
            </div>
            <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Perfil de Entidad
            </div>
          </div>

          {shortName && shortName !== name && (
            <div style={{ fontSize: 20, fontWeight: 700, color: '#1b6b3a', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
              {shortName}
            </div>
          )}

          <div style={{
            fontSize: name.length > 60 ? 32 : 42,
            fontWeight: 800,
            color: '#e3e2e6',
            lineHeight: 1.2,
            marginBottom: 48,
            maxWidth: 900,
          }}>
            {name}
          </div>

          <div style={{ display: 'flex', gap: 48, marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Adjudicaciones</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#e3e2e6', lineHeight: 1 }}>{totalContracts.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monto Total</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#1b6b3a', lineHeight: 1 }}>{formatAmount(totalAmount)}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Alertas Activas</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: alertColor, lineHeight: 1 }}>{activeAlerts}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Compra Directa</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#e3e2e6', lineHeight: 1 }}>{directPct}%</div>
            </div>
          </div>
        </div>

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
