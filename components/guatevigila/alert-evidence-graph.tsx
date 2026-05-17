'use client'

import { useEffect, useMemo } from 'react'
import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  Position,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { AlertDetail, RiskLevel, SignalType } from '@/lib/sdk/types'

const CASE_WIDTH = 360
const ACTOR_WIDTH = 240
const SIGNAL_WIDTH = 220
const METRIC_WIDTH = 160

const CASE_HEIGHT = 170
const ACTOR_HEIGHT = 108
const SIGNAL_HEIGHT = 116
const METRIC_HEIGHT = 88

const COLUMN_GAP = 104
const ROW_GAP = 36
const STACK_GAP = 20
const BOARD_PADDING = 32

const ROLE_COLORS: Record<'case' | 'entity' | 'supplier' | 'risk', string> = {
  case: 'var(--tertiary)',
  entity: 'var(--secondary)',
  supplier: 'var(--primary)',
  risk: 'var(--error)',
}

const SIGNAL_COLORS: Record<SignalType, string> = {
  single_bidder: 'var(--tertiary)',
  short_deadline: 'var(--primary)',
  direct_purchase: 'var(--secondary)',
  award_gap: 'var(--error)',
  failed_tenders: 'var(--on-surface-variant)',
}

function getRiskLabel(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case 'critical':
      return 'Riesgo critico'
    case 'high':
      return 'Riesgo alto'
    case 'medium':
      return 'Riesgo medio'
    case 'low':
      return 'Riesgo bajo'
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `Q${(amount / 1_000_000_000).toFixed(1)}B`
  if (amount >= 1_000_000) return `Q${(amount / 1_000_000).toFixed(1)}M`
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    maximumFractionDigits: 0,
  }).format(amount)
}

function cardStyle(width: number, accent: string, variant: 'core' | 'signal' | 'metric' = 'core') {
  const base =
    variant === 'metric'
      ? 'var(--surface-container-lowest)'
      : variant === 'signal'
        ? 'var(--surface-container-low)'
        : 'var(--surface)'

  return {
    width: `${width}px`,
    background: base,
    color: 'var(--on-surface)',
    border: `1px solid var(--outline-variant)`,
    borderTop: `4px solid ${accent}`,
    borderRadius: '16px',
    padding: '14px 16px',
    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
  }
}

function buildEvidenceGraph(alert: AlertDetail): { nodes: Node[]; edges: Edge[]; canvasHeight: number } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const signalCount = Math.max(1, alert.signals.length)
  const tallestMetricStack = Math.max(...alert.signals.map((signal) => signal.metrics.length), 1)
  const actorsColumnHeight = 3 * ACTOR_HEIGHT + 2 * ROW_GAP
  const signalColumnHeight =
    SIGNAL_HEIGHT + 28 + tallestMetricStack * METRIC_HEIGHT + Math.max(0, tallestMetricStack - 1) * STACK_GAP
  const contentHeight = Math.max(CASE_HEIGHT, actorsColumnHeight, signalColumnHeight)
  const boardHeight = BOARD_PADDING * 2 + contentHeight
  const canvasHeight = boardHeight + 56

  const caseX = BOARD_PADDING
  const caseY = boardHeight / 2 - CASE_HEIGHT / 2
  const actorsX = caseX + CASE_WIDTH + COLUMN_GAP
  const actorsY = boardHeight / 2 - actorsColumnHeight / 2
  const signalsXStart = actorsX + ACTOR_WIDTH + COLUMN_GAP + 48
  const signalsY = boardHeight / 2 - signalColumnHeight / 2
  const signalBandWidth = signalCount * SIGNAL_WIDTH + Math.max(0, signalCount - 1) * COLUMN_GAP
  const boardWidth = signalsXStart + signalBandWidth + BOARD_PADDING

  nodes.push({
    id: 'case',
    position: { x: caseX, y: caseY },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: false,
    selectable: false,
    data: {
      label: (
        <div style={{ minWidth: 300 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--tertiary)' }}>
            Caso bajo analisis
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, marginTop: 10 }}>
            {alert.entityName}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--on-surface-variant)', marginTop: 10 }}>
            {alert.description}
          </div>
        </div>
      ),
    },
    style: cardStyle(CASE_WIDTH, ROLE_COLORS.case),
  })

  const actorNodes: Array<{
    id: string
    accent: string
    width: number
    y: number
    label: React.ReactNode
  }> = [
    {
      id: 'risk',
      accent: ROLE_COLORS.risk,
      width: ACTOR_WIDTH,
      y: actorsY,
      label: (
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--error)' }}>
            Score
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}>
            {alert.riskScore}
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 6 }}>
            {getRiskLabel(alert.riskLevel)}
          </div>
        </div>
      ),
    },
    {
      id: 'entity',
      accent: ROLE_COLORS.entity,
      width: ACTOR_WIDTH,
      y: actorsY + ACTOR_HEIGHT + ROW_GAP,
      label: (
        <div style={{ minWidth: 180 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--secondary)' }}>
            Entidad
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>
            {alert.entityName}
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 6 }}>
            Actor comprador observado
          </div>
        </div>
      ),
    },
    {
      id: 'supplier',
      accent: ROLE_COLORS.supplier,
      width: ACTOR_WIDTH,
      y: actorsY + (ACTOR_HEIGHT + ROW_GAP) * 2,
      label: (
        <div style={{ minWidth: 200 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--primary)' }}>
            Proveedor
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginTop: 10 }}>
            {alert.involvedSupplier.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 6 }}>
            NIT: {alert.involvedSupplier.nit}
          </div>
          <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 6, fontWeight: 800 }}>
            {formatCurrency(alert.involvedSupplier.totalAwarded)} en {alert.involvedSupplier.year}
          </div>
        </div>
      ),
    },
  ]

  actorNodes.forEach((node) => {
    nodes.push({
      id: node.id,
      position: { x: actorsX, y: node.y },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
      selectable: false,
      data: { label: node.label },
      style: cardStyle(node.width, node.accent),
    })

    edges.push({
      id: `case-${node.id}`,
      source: 'case',
      target: node.id,
      type: 'smoothstep',
      animated: false,
      style: { stroke: node.accent, strokeWidth: node.id === 'risk' ? 2.3 : 2 },
    })
  })

  alert.signals.forEach((signal, signalIndex) => {
    const signalId = `signal-${signal.id}`
    const accent = SIGNAL_COLORS[signal.type]
    const x = signalsXStart + signalIndex * (SIGNAL_WIDTH + COLUMN_GAP)

    nodes.push({
      id: signalId,
      position: { x, y: signalsY },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Left,
      draggable: false,
      selectable: false,
      data: {
        label: (
          <div style={{ minWidth: 180 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: accent }}>
                {signal.icon}
              </span>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent }}>
                Senal
              </div>
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 10 }}>
              {signal.description}
            </div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 8, lineHeight: 1.45 }}>
              {signal.title}
            </div>
          </div>
        ),
      },
      style: cardStyle(220, accent, 'signal'),
    })

    const sourceActor =
      signal.type === 'direct_purchase'
        ? 'risk'
        : signal.type === 'single_bidder'
          ? 'supplier'
          : 'entity'

    edges.push({
      id: `${sourceActor}-${signalId}`,
      source: sourceActor,
      target: signalId,
      type: 'smoothstep',
      style: { stroke: accent, strokeWidth: 2 },
    })

    const metricsYStart = signalsY + SIGNAL_HEIGHT + 36

    signal.metrics.forEach((metric, metricIndex) => {
      const metricId = `${signalId}-metric-${metricIndex}`
      const metricX = x + (SIGNAL_WIDTH - METRIC_WIDTH) / 2
      const metricY = metricsYStart + metricIndex * (METRIC_HEIGHT + STACK_GAP)

      nodes.push({
        id: metricId,
        position: { x: metricX, y: metricY },
        targetPosition: Position.Top,
        draggable: false,
        selectable: false,
        data: {
          label: (
            <div style={{ minWidth: 110, textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: accent }}>
                Evidencia
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>
                {metric.value}
              </div>
              <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', marginTop: 6, lineHeight: 1.35 }}>
                {metric.label}
              </div>
            </div>
          ),
        },
        style: cardStyle(150, accent, 'metric'),
      })

      edges.push({
        id: `${signalId}-${metricId}`,
        source: signalId,
        target: metricId,
        type: 'smoothstep',
        style: { stroke: accent, strokeWidth: 1.6, strokeDasharray: '6 4' },
      })
    })
  })

  return { nodes, edges, canvasHeight }
}

interface AlertEvidenceGraphProps {
  alert: AlertDetail
}

export function AlertEvidenceGraph({ alert }: AlertEvidenceGraphProps) {
  const graph = useMemo(() => buildEvidenceGraph(alert), [alert])
  const [nodes, setNodes, onNodesChange] = useNodesState(graph.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(graph.edges)

  useEffect(() => {
    setNodes(graph.nodes)
    setEdges(graph.edges)
  }, [graph, setEdges, setNodes])

  return (
    <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface">
      <div className="border-b border-outline-variant bg-surface-container-low px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
          Grafo de evidencia
        </p>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          Flujo horizontal del caso: resumen a la izquierda, actores base al centro y senales con evidencias en columnas hacia la derecha.
        </p>
        <p className="mt-2 text-xs text-on-surface-variant">
          Puedes arrastrar los nodos para despejar relaciones cuando quieras revisar un caso con mas detalle.
        </p>
      </div>

      <div className="bg-[radial-gradient(circle_at_center,var(--surface-container-low)_0%,var(--surface)_62%)]" style={{ height: graph.canvasHeight }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.16 }}
          nodesDraggable
          nodesConnectable={false}
          elementsSelectable
          panOnDrag
          zoomOnScroll
          minZoom={0.4}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--outline-variant)" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>

      <div className="flex flex-wrap gap-4 border-t border-outline-variant bg-surface-container-low px-5 py-4 text-xs text-on-surface-variant">
        <span className="font-semibold uppercase tracking-wide">Lectura:</span>
        <span>Izquierda: el caso resumido.</span>
        <span>Centro: score, entidad y proveedor.</span>
        <span>Derecha: senales activas.</span>
        <span>Debajo de cada senal: pruebas cuantitativas.</span>
      </div>
    </div>
  )
}
