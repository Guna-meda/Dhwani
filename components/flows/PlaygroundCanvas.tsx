'use client'

import { useCallback, useMemo, useState, useRef, type DragEvent } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type NodeProps,
  type Connection,
  type NodeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { X, Save, Loader2, AlertCircle, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DynamicIcon from '@/components/marketplace/DynamicIcon'
import type { Tool, FlowNode as ApiFlowNode, FlowEdge as ApiFlowEdge } from '@/lib/api/client'

// Fixed, undeletable system nodes. NOT persisted as part of Flow.nodes (see
// flow.model.js) — every tool node auto-connects from/to these by default,
// so these ids only ever need to exist on the CLIENT, to give the canvas
// something to draw the default wiring against.
const START_NODE_ID = '__brand_details__'
const REPORT_NODE_ID = '__report__'

type ToolNodeData = {
  label: string
  icon?: string | null
  category?: string
  removable: boolean
  onRemove: (nodeId: string) => void
}

function ToolNodeComponent({ id, data }: NodeProps) {
  const d = data as unknown as ToolNodeData
  return (
    <div className="min-w-47.5 bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 shadow-sm">
      <Handle type="target" position={Position.Left} className="bg-brand-accent! w-2! h-2!" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
          <DynamicIcon name={d.icon} className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-brand-text truncate flex-1">{d.label}</span>
        {d.removable && (
          <button onClick={() => d.onRemove(id)} className="text-brand-muted hover:text-red-400 shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="bg-brand-accent! w-2! h-2!" />
    </div>
  )
}

function FixedNodeComponent({ data }: NodeProps) {
  const d = data as unknown as { label: string; kind: 'start' | 'report' }
  return (
    <div className="min-w-37.5 bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-3 py-3 text-center">
      {d.kind === 'report' && (
        <Handle type="target" position={Position.Left} className="bg-brand-primary! w-2! h-2!" />
      )}
      <span className="text-xs font-semibold text-brand-accent">{d.label}</span>
      {d.kind === 'start' && (
        <Handle type="source" position={Position.Right} className="bg-brand-primary! w-2! h-2!" />
      )}
    </div>
  )
}

const nodeTypes: NodeTypes = {
  tool: ToolNodeComponent,
  fixed: FixedNodeComponent,
}

export interface SaveNodePayload {
  nodeId: string
  toolId: string
  position: { x: number; y: number }
}

interface PlaygroundCanvasProps {
  libraryTools: Tool[]
  initialNodes: ApiFlowNode[]
  initialEdges: ApiFlowEdge[]
  onSave: (payload: { nodes: SaveNodePayload[]; edges: ApiFlowEdge[] }) => Promise<void>
  saving: boolean
  saveError: string
}

let nodeIdCounter = 0
function nextNodeId() {
  nodeIdCounter += 1
  return `node_${Date.now()}_${nodeIdCounter}`
}

function toRfNodes(apiNodes: ApiFlowNode[], toolsById: Map<string, Tool>, onRemove: (nodeId: string) => void): Node[] {
  const toolNodes: Node[] = apiNodes.map(n => {
    const tool = n.tool ?? toolsById.get(n.toolId)
    return {
      id: n.nodeId,
      type: 'tool',
      position: n.position,
      data: {
        label: tool?.name ?? 'Unknown tool',
        icon: tool?.icon ?? null,
        category: tool?.category,
        removable: true,
        onRemove,
      } satisfies ToolNodeData,
    }
  })

  const maxY = Math.max(80, ...apiNodes.map(n => n.position.y), 0)

  return [
    {
      id: START_NODE_ID,
      type: 'fixed',
      position: { x: -220, y: maxY / 2 },
      draggable: false,
      deletable: false,
      data: { label: 'Brand Details', kind: 'start' },
    },
    ...toolNodes,
    {
      id: REPORT_NODE_ID,
      type: 'fixed',
      position: { x: 480, y: maxY / 2 },
      draggable: false,
      deletable: false,
      data: { label: 'Report', kind: 'report' },
    },
  ]
}

/**
 * Explicit tool-to-tool edges (the only ones actually persisted) PLUS
 * synthetic Start->node / node->Report edges for any node missing an
 * explicit incoming/outgoing tool connection — purely visual, never sent
 * back to the API. This mirrors the "every tool node auto-connects from
 * Brand Details and to Report by default" rule from flow.model.js.
 */
function toRfEdges(apiNodes: ApiFlowNode[], apiEdges: ApiFlowEdge[]): Edge[] {
  const hasIncoming = new Set(apiEdges.map(e => e.toNodeId))
  const hasOutgoing = new Set(apiEdges.map(e => e.fromNodeId))

  const explicit: Edge[] = apiEdges.map(e => ({
    id: `${e.fromNodeId}->${e.toNodeId}`,
    source: e.fromNodeId,
    target: e.toNodeId,
  }))

  const synthetic: Edge[] = apiNodes.flatMap(n => {
    const edges: Edge[] = []
    if (!hasIncoming.has(n.nodeId)) {
      edges.push({ id: `start->${n.nodeId}`, source: START_NODE_ID, target: n.nodeId, style: { strokeDasharray: '4 3' }, animated: false })
    }
    if (!hasOutgoing.has(n.nodeId)) {
      edges.push({ id: `${n.nodeId}->report`, source: n.nodeId, target: REPORT_NODE_ID, style: { strokeDasharray: '4 3' }, animated: false })
    }
    return edges
  })

  return [...explicit, ...synthetic]
}

function CanvasInner({ libraryTools, initialNodes, initialEdges, onSave, saving, saveError }: PlaygroundCanvasProps) {
  const toolsById = useMemo(() => new Map(libraryTools.map(t => [t._id, t])), [libraryTools])
  const reactFlowInstance = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const handleRemoveNode = useCallback((nodeId: string) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId))
    setEdges(prev => prev.filter(e => e.source !== nodeId && e.target !== nodeId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(toRfNodes(initialNodes, toolsById, handleRemoveNode))
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRfEdges(initialNodes, initialEdges))
  const [connectError, setConnectError] = useState('')

  // Only allow a manual tool-to-tool connection if the TARGET tool actually
  // declares it accepts the SOURCE tool's output — same rule
  // flow.controller.js enforces server-side (validateFlowShape). Rejecting
  // it here gives instant feedback instead of a failed save.
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const sourceId = 'source' in connection ? connection.source : undefined
      const targetId = 'target' in connection ? connection.target : undefined
      if (!sourceId || !targetId) return false
      if (sourceId === START_NODE_ID || targetId === REPORT_NODE_ID) return true // fixed-node edges are always fine (though not actually stored)
      if (targetId === START_NODE_ID || sourceId === REPORT_NODE_ID) return false

      const sourceNode = nodes.find(n => n.id === sourceId)
      const targetNode = nodes.find(n => n.id === targetId)
      const sourceApiNode = initialNodes.find(n => n.nodeId === sourceId)
      const targetApiNode = initialNodes.find(n => n.nodeId === targetId)
      const sourceTool = sourceApiNode?.tool ?? (sourceApiNode ? toolsById.get(sourceApiNode.toolId) : undefined)
      const targetTool = targetApiNode?.tool ?? (targetApiNode ? toolsById.get(targetApiNode.toolId) : undefined)

      if (!sourceNode || !targetNode || !sourceTool || !targetTool) return true // let a brand-new (unsaved) node through; re-validated on save anyway
      return !!targetTool.accepts_tool_output_from?.includes(sourceTool.slug)
    },
    [nodes, initialNodes, toolsById]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) {
        setConnectError("That tool doesn't accept output from the one you connected — connection ignored.")
        setTimeout(() => setConnectError(''), 4000)
        return
      }
      setEdges(prev => addEdge(connection, prev))
    },
    [isValidConnection, setEdges]
  )

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      const raw = e.dataTransfer.getData('application/x-playground-tool')
      if (!raw || !wrapperRef.current) return
      const tool = JSON.parse(raw) as Tool

      const bounds = wrapperRef.current.getBoundingClientRect()
      const position = reactFlowInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      })

      const nodeId = nextNodeId()
      const newNode: Node = {
        id: nodeId,
        type: 'tool',
        position,
        data: {
          label: tool.name,
          icon: tool.icon,
          category: tool.category,
          removable: true,
          onRemove: handleRemoveNode,
        } satisfies ToolNodeData,
      }

      // Track which tool a client-only node maps to, for the save payload
      // and for isValidConnection — Node.data doesn't round-trip through
      // the API shape, so we stash toolId in a side map instead of on the
      // xyflow node itself (keeps ToolNodeData focused on render concerns).
      pendingToolIdByNodeId.set(nodeId, tool._id)

      setNodes(prev => [...prev, newNode])
    },
    [reactFlowInstance, handleRemoveNode, setNodes]
  )

  // nodeId -> toolId for nodes created on THIS client session (dragged from
  // the palette). Nodes that came from the server already have their toolId
  // known via initialNodes. Combined at save time in handleSaveClick.
  const pendingToolIdByNodeId = useMemo(() => new Map<string, string>(), [])

  async function handleSaveClick() {
    const toolNodeIds = new Set(nodes.filter(n => n.id !== START_NODE_ID && n.id !== REPORT_NODE_ID).map(n => n.id))

    const nodesPayload: SaveNodePayload[] = nodes
      .filter(n => toolNodeIds.has(n.id))
      .map(n => {
        const existing = initialNodes.find(en => en.nodeId === n.id)
        const toolId = existing?.toolId ?? pendingToolIdByNodeId.get(n.id) ?? ''
        return { nodeId: n.id, toolId, position: n.position }
      })

    // Only persist explicit tool-to-tool edges — anything touching the
    // fixed Start/Report nodes is the default wiring and isn't stored.
    const edgesPayload: ApiFlowEdge[] = edges
      .filter(e => toolNodeIds.has(e.source) && toolNodeIds.has(e.target))
      .map(e => ({ fromNodeId: e.source, toNodeId: e.target }))

    await onSave({ nodes: nodesPayload, edges: edgesPayload })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <span>Drag tools from your library onto the canvas. Every tool runs off Brand Details by default —</span>
          <span className="text-brand-text font-medium">draw an edge only to chain one tool&apos;s output into another.</span>
        </div>
        <Button size="sm" onClick={handleSaveClick} disabled={saving}>
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Save
        </Button>
      </div>

      {(saveError || connectError) && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border-b border-red-900/40 px-4 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError || connectError}
        </div>
      )}

      <div className="flex-1 flex min-h-0">
        <div className="w-56 border-r border-brand-border p-3 overflow-y-auto shrink-0">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-brand-muted mb-2">
            Your library
          </span>
          <div className="space-y-1.5">
            {libraryTools.filter(t => t.playground_compatible).map(tool => (
              <div
                key={tool._id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/x-playground-tool', JSON.stringify(tool))
                  e.dataTransfer.effectAllowed = 'move'
                }}
                className="flex items-center gap-2 bg-brand-card border border-brand-border rounded-lg px-2.5 py-2 cursor-grab active:cursor-grabbing hover:bg-brand-surface transition-colors"
              >
                <DynamicIcon name={tool.icon} className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span className="text-xs text-brand-text truncate">{tool.name}</span>
              </div>
            ))}
            {libraryTools.filter(t => t.playground_compatible).length === 0 && (
              <p className="text-xs text-brand-muted">
                Nothing here yet — add flow-compatible tools from the marketplace.
              </p>
            )}
          </div>
        </div>

        <div ref={wrapperRef} className="flex-1 min-h-0" onDragOver={onDragOver} onDrop={onDrop}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            nodeTypes={nodeTypes}
            fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls showInteractive={false} className="playground-controls" />
            <MiniMap
              pannable
              zoomable
              className="bg-brand-card!"
              maskColor="rgba(6, 11, 13, 0.75)"
              nodeColor="#0D171A"
              nodeStrokeColor="#2AA198"
              nodeStrokeWidth={2}
            />
          </ReactFlow>
        </div>
      </div>
    </div>
  )
}

export default function PlaygroundCanvas(props: PlaygroundCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}