import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import { SITE } from '@/lib/constants/site'

export const runtime = 'nodejs'
export const alt = 'Perfil de proveedor — GuateVigila'
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

const RISK_LABEL: Record<string, string> = {
  critical: 'CRÍTICO',
  high: 'ALTO',
  medium: 'MEDIO',
  low: 'BAJO',
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supplier = await client.getSupplierById(decodeURIComponent(id))

  const name = supplier?.name ?? 'Proveedor'
  const nit = supplier?.nit ?? ''
  const totalContracts = supplier?.totalContracts ?? 0
  const totalAwarded = supplier?.totalAwarded ?? 0
  const clientEntities = supplier?.clientEntities ?? 0
  const singleBidderPct = supplier?.singleBidderPercentage ?? 0
  const alertCount = supplier?.alerts?.length ?? 0

  const riskLevel = alertCount > 0
    ? (singleBidderPct >= 80 ? 'critical' : singleBidderPct >= 60 ? 'high' : 'medium')
    : 'low'
  const riskColor = RISK_COLOR[riskLevel]
  const riskLabel = RISK_LABEL[riskLevel]

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Perfil de Proveedor
              </div>
              {alertCount > 0 && (
                <div style={{
                  background: riskColor,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  padding: '4px 12px',
                  display: 'flex',
                }}>
                  {riskLabel}
                </div>
              )}
            </div>
          </div>

          <div style={{
            fontSize: name.length > 50 ? 36 : 44,
            fontWeight: 800,
            color: '#e3e2e6',
            lineHeight: 1.2,
            marginBottom: 8,
            maxWidth: 900,
          }}>
            {name}
          </div>

          {nit && (
            <div style={{ fontSize: 18, color: '#8e9199', marginBottom: 40 }}>
              NIT: {nit}
            </div>
          )}

          <div style={{ display: 'flex', gap: 40, marginTop: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Contratos</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#e3e2e6', lineHeight: 1 }}>{totalContracts.toLocaleString()}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monto Adjudicado</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#1b6b3a', lineHeight: 1 }}>{formatAmount(totalAwarded)}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Entidades Cliente</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: '#e3e2e6', lineHeight: 1 }}>{clientEntities}</div>
            </div>
            <div style={{ width: 1, background: '#2a2d30', display: 'flex' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ fontSize: 13, color: '#8e9199', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Oferente Único</div>
              <div style={{ fontSize: 44, fontWeight: 800, color: singleBidderPct > 60 ? riskColor : '#e3e2e6', lineHeight: 1 }}>{singleBidderPct}%</div>
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
