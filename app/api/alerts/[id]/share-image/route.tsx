import { ImageResponse } from 'next/og'
import { client } from '@/lib/sdk/client'
import {
  buildAlertPagePath,
  buildAlertShareHighlights,
  formatAlertShareCurrency,
  getAlertRiskLabel,
  type AlertShareImageVariant,
} from '@/lib/alerts/share'

export const runtime = 'nodejs'

const IMAGE_SIZE = { width: 1200, height: 675 }

const RISK_COLORS = {
  critical: '#d64045',
  high: '#ea580c',
  medium: '#c48a18',
  low: '#2f855a',
} as const

const SIGNAL_COLORS = ['#4f46e5', '#0f766e', '#b45309'] as const

type AlertForShareImage = NonNullable<Awaited<ReturnType<typeof client.getAlertById>>>

function renderSummaryImage(alert: AlertForShareImage) {
  const highlights = buildAlertShareHighlights(alert, 3)
  const riskColor = RISK_COLORS[alert.riskLevel]

  return (
    <div
      style={{
        width: IMAGE_SIZE.width,
        height: IMAGE_SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f1115 0%, #171923 55%, #111827 100%)',
        color: '#f8fafc',
        padding: 40,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 24, fontWeight: 800 }}>GuateVigila</div>
          <div style={{ fontSize: 14, color: '#94a3b8', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Snapshot para X
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            background: riskColor,
            color: '#fff',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {getAlertRiskLabel(alert.riskLevel)}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1.25,
            background: 'rgba(15, 23, 42, 0.62)',
            border: '1px solid rgba(148, 163, 184, 0.22)',
            borderRadius: 28,
            padding: 28,
          }}
        >
          <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            Alerta individual
          </div>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, lineHeight: 1.1, marginTop: 14 }}>
            {alert.entityName}
          </div>
          <div style={{ display: 'flex', fontSize: 18, lineHeight: 1.45, color: '#cbd5e1', marginTop: 18 }}>
            {alert.description}
          </div>

          <div
            style={{
              display: 'flex',
              marginTop: 'auto',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                width: 144,
                borderRadius: 22,
                padding: 18,
                background: 'rgba(217, 70, 70, 0.12)',
                border: `1px solid ${riskColor}55`,
              }}
            >
              <div style={{ display: 'flex', fontSize: 11, color: '#cbd5e1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Score
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 42, fontWeight: 800, color: riskColor }}>
                {alert.riskScore}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                borderRadius: 22,
                padding: 18,
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.18)',
              }}
            >
              <div style={{ display: 'flex', fontSize: 11, color: '#cbd5e1', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Proveedor involucrado
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>
                {alert.involvedSupplier.name}
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 15, color: '#93c5fd' }}>
                {formatAlertShareCurrency(alert.involvedSupplier.totalAwarded)} adjudicados
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 0.95,
            gap: 14,
          }}
        >
          {highlights.map((highlight, index) => (
            <div
              key={highlight}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                borderRadius: 24,
                padding: 20,
                background: 'rgba(248, 250, 252, 0.05)',
                border: `1px solid ${SIGNAL_COLORS[index % SIGNAL_COLORS.length]}55`,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  width: 40,
                  height: 4,
                  borderRadius: 999,
                  background: SIGNAL_COLORS[index % SIGNAL_COLORS.length],
                  marginBottom: 14,
                }}
              />
              <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Hallazgo {index + 1}
              </div>
              <div style={{ display: 'flex', marginTop: 12, fontSize: 19, lineHeight: 1.35, fontWeight: 700 }}>
                {highlight}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: 22,
          paddingTop: 18,
          borderTop: '1px solid rgba(148, 163, 184, 0.18)',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 14,
          color: '#94a3b8',
        }}
      >
        <div>{buildAlertPagePath(alert.id)}</div>
        <div>Comparte el link para abrir la alerta exacta</div>
      </div>
    </div>
  )
}

function renderEvidenceImage(alert: AlertForShareImage) {
  const visibleSignals = alert.signals.slice(0, 3)
  const riskColor = RISK_COLORS[alert.riskLevel]

  return (
    <div
      style={{
        width: IMAGE_SIZE.width,
        height: IMAGE_SIZE.height,
        display: 'flex',
        flexDirection: 'column',
        background: '#0b1020',
        color: '#e2e8f0',
        padding: 34,
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, color: '#f8fafc' }}>GuateVigila</div>
          <div style={{ display: 'flex', fontSize: 13, color: '#94a3b8', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6 }}>
            Snapshot de evidencia
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 20,
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            padding: '12px 16px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#94a3b8' }}>
            Score
          </div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 800, color: riskColor }}>
            {alert.riskScore}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: 22,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 310,
            borderRadius: 24,
            padding: 22,
            background: 'rgba(15, 23, 42, 0.86)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
          }}
        >
          <div style={{ display: 'flex', fontSize: 11, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Caso
          </div>
          <div style={{ display: 'flex', marginTop: 12, fontSize: 28, lineHeight: 1.15, fontWeight: 800, color: '#f8fafc' }}>
            {alert.entityName}
          </div>
          <div style={{ display: 'flex', marginTop: 14, fontSize: 16, lineHeight: 1.4, color: '#cbd5e1' }}>
            {alert.description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 16,
            width: 230,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 22,
              padding: 18,
              background: 'rgba(14, 116, 144, 0.16)',
              border: '1px solid rgba(34, 211, 238, 0.32)',
            }}
          >
            <div style={{ display: 'flex', fontSize: 11, color: '#67e8f9', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Entidad
            </div>
            <div style={{ display: 'flex', marginTop: 10, fontSize: 18, lineHeight: 1.25, fontWeight: 700 }}>
              {alert.entityName}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 22,
              padding: 18,
              background: 'rgba(37, 99, 235, 0.16)',
              border: '1px solid rgba(96, 165, 250, 0.32)',
            }}
          >
            <div style={{ display: 'flex', fontSize: 11, color: '#93c5fd', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Proveedor
            </div>
            <div style={{ display: 'flex', marginTop: 10, fontSize: 18, lineHeight: 1.25, fontWeight: 700 }}>
              {alert.involvedSupplier.name}
            </div>
            <div style={{ display: 'flex', marginTop: 8, fontSize: 13, color: '#bfdbfe' }}>
              NIT {alert.involvedSupplier.nit}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: 16,
            justifyContent: 'center',
          }}
        >
          {visibleSignals.map((signal, index) => (
            <div
              key={signal.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 24,
                padding: 20,
                background: 'rgba(248, 250, 252, 0.05)',
                border: `1px solid ${SIGNAL_COLORS[index % SIGNAL_COLORS.length]}66`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', fontSize: 12, color: SIGNAL_COLORS[index % SIGNAL_COLORS.length], letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>
                  {signal.description}
                </div>
                <div style={{ display: 'flex', fontSize: 12, color: '#94a3b8' }}>
                  Hallazgo {index + 1}
                </div>
              </div>
              <div style={{ display: 'flex', marginTop: 10, fontSize: 21, lineHeight: 1.3, fontWeight: 700, color: '#f8fafc' }}>
                {signal.title}
              </div>
              <div style={{ display: 'flex', marginTop: 14, gap: 10, flexWrap: 'wrap' }}>
                {signal.metrics.slice(0, 3).map((metric) => (
                  <div
                    key={`${signal.id}-${metric.label}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 120,
                      borderRadius: 18,
                      padding: '10px 12px',
                      background: 'rgba(15, 23, 42, 0.78)',
                      border: '1px solid rgba(148, 163, 184, 0.14)',
                    }}
                  >
                    <div style={{ display: 'flex', fontSize: 18, fontWeight: 800, color: '#f8fafc' }}>{metric.value}</div>
                    <div style={{ display: 'flex', marginTop: 6, fontSize: 11, lineHeight: 1.35, color: '#94a3b8' }}>{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const alert = await client.getAlertById(id)

  if (!alert) {
    return new Response('Not found', { status: 404 })
  }

  const variant = new URL(request.url).searchParams.get('variant')
  const resolvedVariant: AlertShareImageVariant = variant === 'evidence' ? 'evidence' : 'summary'

  return new ImageResponse(
    resolvedVariant === 'evidence' ? renderEvidenceImage(alert) : renderSummaryImage(alert),
    IMAGE_SIZE
  )
}
