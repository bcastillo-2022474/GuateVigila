import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import { SITE } from '@/lib/constants/site'

export const runtime = 'nodejs'
export const alt = 'Auditoría Institucional — GuateVigila'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function formatAmount(n: number): string {
  if (n >= 1_000_000_000) return `Q${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `Q${(n / 1_000_000).toFixed(1)}M`
  return `Q${n.toLocaleString('es-GT')}`
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const entity = await client.getEntityById(decodeURIComponent(id))

  const name = entity?.name ?? 'Entidad Gubernamental'
  const shortName = entity?.shortName ?? ''
  const totalContracts = entity?.totalContracts ?? 0
  const totalAmount = entity?.totalAmount ?? 0
  const activeAlerts = entity?.activeAlerts ?? 0
  const directPct = entity?.directPurchasePercentage ?? 0

  // Colores estilizados (modo Dark)
  const isHighRisk = activeAlerts > 0
  const topBarColor = isHighRisk ? '#ef4444' : '#3b82f6' // Rojo si hay alertas, azul si está limpia
  const alertColor = isHighRisk ? '#ef4444' : '#10b981' // Rojo (peligro) vs Verde (seguro)

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          background: '#09090b', // zinc-950 puro oscuro
          fontFamily: 'sans-serif',
        }}
      >
        {/* Barra superior de estado (dinámica por nivel de riesgo) */}
        <div style={{ width: '100%', height: 8, background: topBarColor, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '56px 72px' }}>
          
          {/* Header OSINT / UI */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.5px' }}>
                GuateVigila
              </div>
              <div style={{ fontSize: 24, color: '#52525b', paddingBottom: 4 }}>/</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: '#a1a1aa' }}>
                Monitoreo de Contratos
              </div>
            </div>
            <div style={{ 
              fontSize: 14, 
              color: isHighRisk ? '#fca5a5' : '#a1a1aa', 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              background: isHighRisk ? '#7f1d1d' : '#27272a',
              padding: '8px 16px',
              borderRadius: 4,
              fontWeight: 600
            }}>
              {isHighRisk ? 'RIESGO DETECTADO' : 'AUDITORÍA BASE'}
            </div>
          </div>

          {/* Nombre Entidad */}
          {shortName && shortName !== name && (
            <div style={{ fontSize: 22, fontWeight: 700, color: '#a1a1aa', letterSpacing: '0.1em', marginBottom: 12, textTransform: 'uppercase' }}>
              {shortName}
            </div>
          )}

          <div style={{
            fontSize: name.length > 50 ? 44 : 56,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.1,
            marginBottom: 64,
            maxWidth: 1000,
          }}>
            {name}
          </div>

          {/* Estadísticas (KPIs) */}
          <div style={{ display: 'flex', gap: 64, marginTop: 'auto', background: '#18181b', padding: '32px 48px', borderRadius: 16, border: '1px solid #27272a' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Adjudicaciones</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#fafafa', lineHeight: 1 }}>{totalContracts.toLocaleString()}</div>
            </div>
            
            <div style={{ width: 1, background: '#27272a', display: 'flex' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Presupuesto (Q)</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#fafafa', lineHeight: 1 }}>{formatAmount(totalAmount)}</div>
            </div>
            
            <div style={{ width: 1, background: '#27272a', display: 'flex' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Alertas Críticas</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: alertColor, lineHeight: 1 }}>{activeAlerts}</div>
            </div>
            
            <div style={{ width: 1, background: '#27272a', display: 'flex' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, color: '#a1a1aa', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Evita Licitación</div>
              <div style={{ fontSize: 48, fontWeight: 800, color: '#fafafa', lineHeight: 1 }}>{directPct}%</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}