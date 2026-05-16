'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Node,
  type Edge,
  Position,
  BackgroundVariant,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Entity } from '@/lib/sdk/types'

const RISK_COLORS: Record<string, string> = {
  critical: '#ba1a1a',
  high: '#e65100',
  medium: '#795548',
  low: '#2e7d32',
}

const RISK_BG: Record<string, string> = {
  critical: '#ffdad6',
  high: '#ffe0cc',
  medium: '#f5f0ee',
  low: '#d8f3dc',
}

const RISK_LABEL: Record<string, string> = {
  critical: 'CRÍTICO',
  high: 'ALTO',
  medium: 'MEDIO',
  low: 'BAJO',
}

function buildGraph(entity: Entity): { nodes: Node[]; edges: Edge[] } {
  const formatAmount = (n: number, currency: string) => {
    if (n >= 1_000_000_000) return `${currency} ${(n / 1_000_000_000).toFixed(1)}B`
    if (n >= 1_000_000) return `${currency} ${(n / 1_000_000).toFixed(1)}M`
    return `${currency} ${n.toLocaleString('es-GT')}`
  }

  const centerNode: Node = {
    id: 'entity',
    type: 'default',
    position: { x: 0, y: 0 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    data: { label: entity.shortName || entity.name },
    style: {
      background: '#1a1c1e',
      color: '#e3e2e6',
      border: '2px solid #444749',
      borderRadius: '4px',
      padding: '12px 20px',
      fontWeight: 700,
      fontSize: '14px',
      minWidth: '180px',
      textAlign: 'center',
    },
  }

  const count = entity.topSuppliers.length
  const verticalSpacing = 110
  const totalHeight = (count - 1) * verticalSpacing
  const startY = -totalHeight / 2

  const supplierNodes: Node[] = entity.topSuppliers.map((s, i) => {
    const color = RISK_COLORS[s.riskLevel] ?? '#444'
    const bg = RISK_BG[s.riskLevel] ?? '#f5f5f5'
    const label = RISK_LABEL[s.riskLevel] ?? s.riskLevel
    return {
      id: `supplier-${s.supplierId}`,
      type: 'default',
      position: { x: 380, y: startY + i * verticalSpacing },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: {
        label: (
          <div style={{ textAlign: 'left', minWidth: '200px' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 4 }}>
              {s.supplierName}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '12px', color: '#555' }}>
                {formatAmount(s.totalAmount, s.currency)}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color,
                  background: bg,
                  border: `1px solid ${color}`,
                  borderRadius: 2,
                  padding: '1px 6px',
                  letterSpacing: '0.05em',
                }}
              >
                {label}
              </span>
            </div>
          </div>
        ),
      },
      style: {
        background: '#f8f9fa',
        border: `2px solid ${color}`,
        borderRadius: '4px',
        padding: '10px 16px',
        minWidth: '240px',
      },
    }
  })

  const edges: Edge[] = entity.topSuppliers.map((s) => ({
    id: `e-entity-${s.supplierId}`,
    source: 'entity',
    target: `supplier-${s.supplierId}`,
    animated: false,
    style: { stroke: '#c4c7c5', strokeWidth: 1.5 },
    label: `${s.contractCount} contrato${s.contractCount !== 1 ? 's' : ''}`,
    labelStyle: { fontSize: 10, fill: '#888', fontWeight: 500 },
    labelBgStyle: { fill: 'transparent' },
  }))

  return { nodes: [centerNode, ...supplierNodes], edges }
}

interface EntityGraphProps {
  entity: Entity
}

export function EntityGraph({ entity }: EntityGraphProps) {
  const { nodes: initialNodes, edges: initialEdges } = buildGraph(entity)
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  return (
    <div className="bg-surface-container-lowest border border-outline-variant" style={{ height: 520 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#c4c7c5" />
        <Controls />
        <MiniMap
          nodeColor={(n) => {
            if (n.id === 'entity') return '#1a1c1e'
            const supplier = entity.topSuppliers.find(
              (s) => `supplier-${s.supplierId}` === n.id,
            )
            return RISK_COLORS[supplier?.riskLevel ?? 'low'] ?? '#888'
          }}
          maskColor="rgba(232, 232, 232, 0.6)"
        />
      </ReactFlow>

      {/* Legend */}
      <div className="flex items-center gap-6 px-4 py-3 border-t border-outline-variant bg-surface-container-low">
        <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">Riesgo proveedor:</span>
        {Object.entries(RISK_LABEL).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: RISK_COLORS[key] }}>
            <span
              className="inline-block w-3 h-3 rounded-sm border"
              style={{ background: RISK_BG[key], borderColor: RISK_COLORS[key] }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
