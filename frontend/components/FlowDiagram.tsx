'use client'
import ReactFlow, {
  Node, Edge, Background, Controls,
  BackgroundVariant, useNodesState, useEdgesState,
  MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useEffect } from 'react'

const NODE_COLORS: Record<string, string> = {
  scan: '#3b82f6',
  filter: '#10b981',
  join: '#f59e0b',
  aggregate: '#8b5cf6',
  subquery: '#ef4444',
  sort: '#06b6d4',
  output: '#6b7280',
  groupby: '#ec4899',
}

const COST_COLORS: Record<string, string> = {
  low: '#10b981',
  medium: '#f59e0b',
  high: '#ef4444',
}

function SqlNode({ data }: { data: any }) {
  const color = NODE_COLORS[data.type] || '#6b7280'
  const costColor = COST_COLORS[data.cost] || '#6b7280'
  return (
    <div style={{
      background: '#18181b',
      border: `1px solid ${color}40`,
      borderLeft: `3px solid ${color}`,
      borderRadius: '6px',
      padding: '10px 14px',
      minWidth: '140px',
      boxShadow: `0 0 12px ${color}15`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'JetBrains Mono, monospace' }}>
          {data.label}
        </span>
        <span style={{ fontSize: '9px', color: costColor, background: `${costColor}20`, padding: '1px 5px', borderRadius: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {data.cost}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: '#71717a', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '160px' }}>
        {data.sublabel}
      </div>
    </div>
  )
}

const nodeTypes = { sqlNode: SqlNode }

interface StructureNode { id: string; type: string; label: string; sublabel: string; cost: string }
interface StructureEdge { from: string; to: string }

interface Props {
  nodes: StructureNode[]
  edges: StructureEdge[]
}

export default function FlowDiagram({ nodes: rawNodes, edges: rawEdges }: Props) {
  const flowNodes: Node[] = rawNodes.map((n, i) => ({
    id: n.id,
    type: 'sqlNode',
    position: { x: 0, y: i * 90 },
    data: { label: n.label, sublabel: n.sublabel, type: n.type, cost: n.cost },
  }))

  const flowEdges: Edge[] = rawEdges.map((e, i) => ({
    id: `e${i}`,
    source: e.from,
    target: e.to,
    markerEnd: { type: MarkerType.ArrowClosed, color: '#3a3a42' },
    style: { stroke: '#3a3a42', strokeWidth: 1.5 },
  }))

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => {
    setNodes(flowNodes)
    setEdges(flowEdges)
  }, [rawNodes, rawEdges])

  if (!rawNodes.length) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#52525b', fontSize: '13px' }}>Run a query to see the execution flow</p>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} color="#2a2a2f" gap={20} size={1} />
      <Controls style={{ background: '#18181b', border: '1px solid #2a2a2f' }} />
    </ReactFlow>
  )
}
