<template>
  <div
    class="flow-canvas-wrapper"
    @drop="onDrop"
    @dragover.prevent
    @dragenter.prevent
  >
    <VueFlow
      id="main"
      v-model:nodes="store.nodes"
      v-model:edges="store.edges"
      :node-types="nodeTypes"
      :default-edge-options="defaultEdgeOptions"
      :is-valid-connection="isValidConnection"
      :delete-key-code="['Delete', 'Backspace']"
      :snap-to-grid="store.snapToGrid"
      :snap-grid="[20, 20]"
      :connection-mode="ConnectionMode.Loose"
      :edges-updatable="false"
      fit-view-on-init
      elevate-edges-on-select
    >
      <Background pattern-color="#bbbbbb" :gap="20" />
      <MiniMap />
      <Controls />
    </VueFlow>
  </div>
</template>

<script setup lang="ts">
import { VueFlow, useVueFlow, MarkerType, ConnectionMode } from '@vue-flow/core'
import type { Connection, Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { nodeTypes } from '@/components/canvas/nodes'
import { useFlowStore } from '@/stores/flowStore'

const store = useFlowStore()

const { screenToFlowCoordinate, addNodes, addEdges, removeEdges, onConnect } = useVueFlow({ id: 'main' })

// ─── Arrow marker applied to every edge ──────────────────────────────────────

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: MarkerType.ArrowClosed,
}

// ─── Connection validation ────────────────────────────────────────────────────

function isValidConnection(connection: Connection): boolean {
  if (connection.source === connection.target) return false
  const { source, target } = connection
  const edges = store.edges as Edge[]
  const nodes = store.nodes as import('@vue-flow/core').Node[]
  const sourceNode = nodes.find((n) => n.id === source)
  const targetNode = nodes.find((n) => n.id === target)

  // Start node can't receive incoming connections
  if (targetNode?.type === 'startEnd' && targetNode.data?.variant === 'start') return false

  // End node can't have outgoing connections
  if (sourceNode?.type === 'startEnd' && sourceNode.data?.variant === 'end') return false

  // Decision node as target: max 1 incoming
  if (targetNode?.type === 'decision') {
    if (edges.filter(e => e.target === target).length >= 1) return false
  }

  // Decision node as source: always allow (replacement handled in onConnect)
  if (sourceNode?.type === 'decision') return true

  // All other nodes: always allow outgoing (replacement of existing handled in onConnect)
  return true
}

// ─── Edge styling ─────────────────────────────────────────────────────────────

const EDGE_LABEL_STYLE     = { fontWeight: 700, fontSize: 12 }
const EDGE_LABEL_STYLE_YES = { ...EDGE_LABEL_STYLE, fill: '#1b5e20' }
const EDGE_LABEL_STYLE_NO  = { ...EDGE_LABEL_STYLE, fill: '#b71c1c' }
const EDGE_LABEL_BG_YES    = { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 1.5, rx: 4, ry: 4 }
const EDGE_LABEL_BG_NO     = { fill: '#ffebee', stroke: '#c62828', strokeWidth: 1.5, rx: 4, ry: 4 }

onConnect((params: Connection) => {
  const edges = store.edges as Edge[]
  const sourceNode = (store.nodes as import('@vue-flow/core').Node[]).find((n) => n.id === params.source)
  const isDecision = sourceNode?.type === 'decision'

  let label: string | undefined
  let branchData: { branch: 'yes' | 'no' } | undefined
  let isYes = false

  if (isDecision) {
    const outEdges = edges.filter(e => e.source === params.source)
    if (outEdges.length === 0) {
      label = 'Sí'; branchData = { branch: 'yes' }; isYes = true
    } else if (outEdges.length === 1) {
      label = 'No'; branchData = { branch: 'no' }; isYes = false
    } else {
      // Both outputs exist → remove BOTH by ID, new connection becomes True
      removeEdges(outEdges.map(e => e.id))
      label = 'Sí'; branchData = { branch: 'yes' }; isYes = true
    }
  } else {
    // Regular nodes: replace any existing outgoing edge (enforces max 1 output)
    const existing = edges.filter(e => e.source === params.source)
    if (existing.length > 0) removeEdges(existing.map(e => e.id))
  }

  addEdges([{
    id: crypto.randomUUID(),
    ...params,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: isYes ? '#2e7d32' : label === 'No' ? '#c62828' : undefined },
    ...(label !== undefined
      ? {
          label,
          style: { stroke: isYes ? '#2e7d32' : '#c62828', strokeWidth: 2 },
          labelStyle: isYes ? EDGE_LABEL_STYLE_YES : EDGE_LABEL_STYLE_NO,
          labelBgStyle: isYes ? EDGE_LABEL_BG_YES : EDGE_LABEL_BG_NO,
          labelBgPadding: [6, 4] as [number, number],
          labelBgBorderRadius: 4,
          data: branchData,
        }
      : {}),
  } as Edge])
})

// ─── Node drop ────────────────────────────────────────────────────────────────

const DEFAULT_LABELS: Record<string, string> = {
  startEnd: 'Inicio',
  process:  'Proceso',
  decision: 'Condición',
  input:    'Leer x',
  output:   'Mostrar x',
  comment:  'Comentario',
}

function onDrop(event: DragEvent) {
  if (!event.dataTransfer) return

  const nodeType = event.dataTransfer.getData('application/nodeType')
  const variant  = event.dataTransfer.getData('application/nodeVariant') || undefined

  if (!nodeType) return

  const position = screenToFlowCoordinate({ x: event.clientX, y: event.clientY })

  let label = DEFAULT_LABELS[nodeType] ?? nodeType
  if (nodeType === 'startEnd' && variant === 'end') label = 'Fin'

  addNodes([{
    id: crypto.randomUUID(),
    type: nodeType,
    position,
    data: { label, ...(variant ? { variant } : {}) },
  }])
}
</script>

<style scoped>
.flow-canvas-wrapper {
  width: 100%;
  height: calc(100vh - 48px);
}
</style>
