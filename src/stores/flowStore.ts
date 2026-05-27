import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Node, Edge } from '@vue-flow/core'

export const useFlowStore = defineStore('flow', () => {
  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([])
  const flowName = ref('Untitled Flow')
  const mode = ref<'edit' | 'simulation'>('edit')
  const snapToGrid = ref(false)

  function setNodes(newNodes: Node[]) {
    nodes.value = newNodes
  }

  function setEdges(newEdges: Edge[]) {
    edges.value = newEdges
  }

  function reset() {
    nodes.value = []
    edges.value = []
    flowName.value = 'Untitled Flow'
    mode.value = 'edit'
  }

  return { nodes, edges, flowName, mode, snapToGrid, setNodes, setEdges, reset }
})
