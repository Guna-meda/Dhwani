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
import { X, Save, Loader2, AlertCircle, Play, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DynamicIcon from '@/components/marketplace/DynamicIcon'
import NodeConfigPanel from './NodeConfigPanel'
import type { Tool, FlowNode as ApiFlowNode, FlowEdge as ApiFlowEdge, InputSchemaField } from '@/lib/api/client'

// Fixed, undeletable system nodes. NOT persisted as part of Flow.nodes (see
// flow.model.js) — every tool node auto-connects from/to these by default,
// so these ids only ever need to exist on the CLIENT, to give the canvas
// something to draw the default wiring against.
// Just the fields the config system needs — n.tool (from GET /flows/:id) is
// already this shape via its Pick<>, and a freshly-dropped node's full Tool
// object satisfies it too.
type NodeTool = Pick<Tool, 'name' | 'slug' | 'input_schema'>

const START_NODE_ID = '__brand_details__'
const REPORT_NODE_ID = '__report__'

type ToolNodeData = {
  label: string
  icon?: string | null
  category?: string
  removable: boolean
  onRemove: (nodeId: string) => void
  // Derived at render time from the tool's input_schema + this node's
  // current config + edges — see needsConfigIds in CanvasInner. Not part
  // of the API shape, purely a visual affordance.
  needsConfig?: boolean
  configurable?: boolean
}

function ToolNodeComponent({ id, data }: NodeProps) {
  const d = data as unknown as ToolNodeData
  return (
    <div className="min-w-[190px] bg-brand-card border border-brand-border rounded-xl px-3 py-2.5 shadow-sm relative">
      {d.needsConfig && (
        <span
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-brand-bg"
          title="Needs configuration"
        />
      )}
      <Handle type="target" position={Position.Left} className="!bg-brand-accent !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-brand-bg border border-brand-border flex items-center justify-center text-brand-accent shrink-0">
          <DynamicIcon name={d.icon} className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-semibold text-brand-text truncate flex-1">{d.label}</span>
        {d.configurable && !d.needsConfig && (
          <Settings2 className="w-3 h-3 text-brand-muted shrink-0" aria-hidden />
        )}
        {d.removable && (
          <button onClick={() => d.onRemove(id)} className="text-brand-muted hover:text-red-400 shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-brand-accent !w-2 !h-2" />
    </div>
  )
}

function FixedNodeComponent({ data }: NodeProps) {
  const d = data as unknown as { label: string; kind: 'start' | 'report' }
  return (
    <div className="min-w-[150px] bg-brand-primary/10 border border-brand-primary/30 rounded-xl px-3 py-3 text-center">
      {d.kind === 'report' && (
        <Handle type="target" position={Position.Left} className="!bg-brand-primary !w-2 !h-2" />
      )}
      <span className="text-xs font-semibold text-brand-accent">{d.label}</span>
      {d.kind === 'start' && (
        <Handle type="source" position={Position.Right} className="!bg-brand-primary !w-2 !h-2" />
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
  config: Record<string, unknown>
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
      deletable: false,
      data: { label: 'Brand Details', kind: 'start' },
    },
    ...toolNodes,
    {
      id: REPORT_NODE_ID,
      type: 'fixed',
      position: { x: 480, y: maxY / 2 },
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
    setNodeToolMap(prev => {
      const next = new Map(prev)
      next.delete(nodeId)
      return next
    })
    setNodeConfigs(prev => {
      const next = new Map(prev)
      next.delete(nodeId)
      return next
    })
    setSelectedNodeId(prev => (prev === nodeId ? null : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(toRfNodes(initialNodes, toolsById, handleRemoveNode))
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRfEdges(initialNodes, initialEdges))
  const [connectError, setConnectError] = useState('')

  // nodeId -> resolved tool (for config panel field defs) and nodeId ->
  // current config values. Seeded from initialNodes; new nodes (dragged
  // from the palette this session) are added in onDrop, since a fresh node
  // has no server-assigned data to seed from yet.
  const [nodeToolMap, setNodeToolMap] = useState<Map<string, NodeTool>>(() => {
    const map = new Map<string, NodeTool>()
    for (const n of initialNodes) {
      const tool = n.tool ?? toolsById.get(n.toolId)
      if (tool) map.set(n.nodeId, tool as NodeTool)
    }
    return map
  })
  const [nodeConfigs, setNodeConfigs] = useState<Map<string, Record<string, unknown>>>(
    () => new Map(initialNodes.map(n => [n.nodeId, n.config ?? {}]))
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [configError, setConfigError] = useState('')

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
      setNodeToolMap(prev => new Map(prev).set(nodeId, tool))
      setNodeConfigs(prev => new Map(prev).set(nodeId, {}))

      setNodes(prev => [...prev, newNode])

      // Auto-open the config panel only if there's actually something to
      // configure — opening an empty panel for e.g. the crawlability check
      // (no fields) would just be an extra click to dismiss for no reason.
      if ((tool.input_schema?.fields?.length ?? 0) > 0) {
        setSelectedNodeId(nodeId)
      }
    },
    [reactFlowInstance, handleRemoveNode, setNodes]
  )

  // nodeId -> toolId for nodes created on THIS client session (dragged from
  // the palette). Nodes that came from the server already have their toolId
  // known via initialNodes. Combined at save time in handleSaveClick.
  const pendingToolIdByNodeId = useMemo(() => new Map<string, string>(), [])

  // Which tool nodes currently have an explicit incoming tool-to-tool edge
  // (excludes the synthetic Start->node default wiring) — needed both to
  // decide whether a required "either"-source field is satisfiable, and to
  // tell the config panel to show "filled automatically" instead of an input.
  const hasIncomingEdge = useMemo(
    () => new Set(edges.filter(e => e.source !== START_NODE_ID).map(e => e.target)),
    [edges]
  )

  // Nodes whose tool has a required field that's currently unfilled and not
  // satisfiable by an upstream edge — drives the amber status dot.
  const needsConfigIds = useMemo(() => {
    const ids = new Set<string>()
    for (const n of nodes) {
      if (n.id === START_NODE_ID || n.id === REPORT_NODE_ID) continue
      const tool = nodeToolMap.get(n.id)
      const fields = tool?.input_schema?.fields ?? []
      const config = nodeConfigs.get(n.id) ?? {}
      const satisfiable = hasIncomingEdge.has(n.id)
      const missing = fields.some((f: InputSchemaField) => {
        if (!f.required) return false
        if ((f.source === 'upstream' || f.source === 'either') && satisfiable) return false
        const v = config[f.key]
        return v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)
      })
      if (missing) ids.add(n.id)
    }
    return ids
  }, [nodes, nodeToolMap, nodeConfigs, hasIncomingEdge])

  // Render-time node array: same nodes, with needsConfig merged into data
  // so the dot stays in sync with config/edge changes without touching the
  // underlying nodes state (which onNodesChange/setNodes own).
  const nodesForRender = useMemo(
    () => nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        needsConfig: needsConfigIds.has(n.id),
        configurable: (nodeToolMap.get(n.id)?.input_schema?.fields?.length ?? 0) > 0,
      },
    })),
    [nodes, needsConfigIds, nodeToolMap]
  )

  const onNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.id === START_NODE_ID || node.id === REPORT_NODE_ID) return
    setSelectedNodeId(node.id)
  }, [])

  const selectedTool = selectedNodeId ? nodeToolMap.get(selectedNodeId) : null
  const selectedConfig = selectedNodeId ? (nodeConfigs.get(selectedNodeId) ?? {}) : {}

  async function handleSaveClick() {
    if (needsConfigIds.size > 0) {
      const firstId = [...needsConfigIds][0]
      const tool = nodeToolMap.get(firstId)
      setConfigError(`"${tool?.name ?? 'A tool'}" needs some required fields filled in before saving.`)
      setSelectedNodeId(firstId)
      return
    }
    setConfigError('')

    const toolNodeIds = new Set(nodes.filter(n => n.id !== START_NODE_ID && n.id !== REPORT_NODE_ID).map(n => n.id))

    const nodesPayload: SaveNodePayload[] = nodes
      .filter(n => toolNodeIds.has(n.id))
      .map(n => {
        const existing = initialNodes.find(en => en.nodeId === n.id)
        const toolId = existing?.toolId ?? pendingToolIdByNodeId.get(n.id) ?? ''
        return { nodeId: n.id, toolId, position: n.position, config: nodeConfigs.get(n.id) ?? {} }
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

      {(saveError || connectError || configError) && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-950/20 border-b border-red-900/40 px-4 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {saveError || connectError || configError}
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
            nodes={nodesForRender}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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
              className="!bg-brand-card"
              maskColor="rgba(6, 11, 13, 0.75)"
              nodeColor="#0D171A"
              nodeStrokeColor="#2AA198"
              nodeStrokeWidth={2}
            />
          </ReactFlow>
        </div>

        {selectedNodeId && selectedTool && (
          <NodeConfigPanel
            toolName={selectedTool.name}
            fields={selectedTool.input_schema?.fields ?? []}
            config={selectedConfig}
            hasUpstreamEdge={hasIncomingEdge.has(selectedNodeId)}
            onChange={next => setNodeConfigs(prev => new Map(prev).set(selectedNodeId, next))}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
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