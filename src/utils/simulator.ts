import type { Node, Edge } from '@vue-flow/core'
import { useFlowStore } from '@/stores/flowStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { evaluateBool, executeProcess, evaluate } from '@/utils/evaluator'
import type { VarMap } from '@/utils/evaluator'

const MAX_STEPS = 10_000

/** Delay between auto-play steps in ms. 0 = step-by-step only. */
let autoPlayDelay = 600

export function setAutoPlayDelay(ms: number) {
  autoPlayDelay = ms
}

// ─── Graph helpers ────────────────────────────────────────────────────────────

function buildEdgeIndex(edges: Edge[]): Map<string, Edge[]> {
  const index = new Map<string, Edge[]>()
  for (const edge of edges) {
    const key = edge.source
    if (!index.has(key)) index.set(key, [])
    index.get(key)!.push(edge)
  }
  return index
}

function findStartNode(nodes: Node[]): Node | undefined {
  return nodes.find((n) => n.type === 'startEnd' && n.data?.variant === 'start')
}

/** Return the next node id for a given source, optionally filtering by exact sourceHandle. */
function nextNode(
  nodeId: string,
  edgeIndex: Map<string, Edge[]>,
  handleId?: string,
): string | null {
  const outEdges = edgeIndex.get(nodeId) ?? []
  const edge = handleId
    ? outEdges.find((e) => e.sourceHandle === handleId)
    : outEdges[0]
  return edge?.target ?? null
}

// ─── Active-node highlighting ─────────────────────────────────────────────────

function setActive(nodeId: string | null, nodes: Node[]) {
  for (const n of nodes) {
    n.data = { ...n.data, isActive: n.id === nodeId }
  }
}

// ─── Simulation runner ────────────────────────────────────────────────────────

export async function runSimulation(mode: 'step' | 'play') {
  const flowStore = useFlowStore()
  const sim = useSimulationStore()
  // Use explicit cast to avoid TS deep-instantiation on Vue Flow generics
  const nodes = flowStore.nodes as Node[]
  const edges = flowStore.edges as Edge[]

  if (sim.state === 'idle' || sim.state === 'done' || sim.state === 'error') {
    // Fresh start
    sim.reset()
    const startNode = findStartNode(nodes)
    if (!startNode) {
      sim.errorMessage = 'No se encontró un bloque de Inicio en el diagrama.'
      sim.state = 'error'
      return
    }
    sim.currentNodeId = startNode.id
    sim.state = 'paused'
  }

  if (mode === 'step') {
    await executeStep(nodes, edges, sim)
  } else {
    // Play: keep stepping until done/error/waiting_input or paused externally
    sim.state = 'running'
    while (sim.state === 'running') {
      await executeStep(nodes, edges, sim)
      if (sim.state === 'running') {
        await delay(autoPlayDelay)
      }
    }
  }
}

export function pauseSimulation() {
  const sim = useSimulationStore()
  if (sim.state === 'running') sim.state = 'paused'
}

export function resetSimulation() {
  const flowStore = useFlowStore()
  const sim = useSimulationStore()
  setActive(null, flowStore.nodes as Node[])
  sim.reset()
}

async function executeStep(nodes: Node[], edges: Edge[], sim: ReturnType<typeof useSimulationStore>) {
  if (!sim.currentNodeId) {
    sim.state = 'done'
    return
  }

  const node = nodes.find((n) => n.id === sim.currentNodeId)
  if (!node) {
    sim.errorMessage = `Nodo no encontrado: ${sim.currentNodeId}`
    sim.state = 'error'
    setActive(null, nodes)
    return
  }

  // Highlight active node
  setActive(node.id, nodes)

  const edgeIndex = buildEdgeIndex(edges)
  const label: string = node.data?.label ?? ''
  let nextId: string | null = null

  try {
    switch (node.type) {
      case 'startEnd': {
        if (node.data?.variant === 'end') {
          sim.state = 'done'
          setActive(null, nodes)
          return
        }
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
        break
      }

      case 'process': {
        sim.variables = executeProcess(label, sim.variables as VarMap)
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
        break
      }

      case 'decision': {
        const branch = evaluateBool(label, sim.variables as VarMap)
        const outEdges = edgeIndex.get(node.id) ?? []
        const branchKey = branch ? 'yes' : 'no'
        const branchEdge = outEdges.find(e => (e.data as Record<string, unknown>)?.branch === branchKey)
        nextId = branchEdge?.target ?? null
        sim.state = 'paused'
        break
      }

      case 'input': {
        const value = await requestInput(label, sim)
        // Parse assignment: "Leer x" → assign to x; or bare "x" → same
        const varName = parseInputTarget(label)
        if (!varName) {
          throw new Error(`No se pudo determinar la variable para el bloque de entrada: "${label}"`)
        }
        const parsed = parseValue(value)
        sim.variables = { ...sim.variables, [varName]: parsed }
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
        break
      }

      case 'output': {
        const result = evaluateOutputLabel(label, sim.variables as VarMap)
        sim.appendOutput(result)
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
        break
      }

      case 'comment':
        // Comments are invisible to the simulator — skip to next node
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
        break

      default:
        nextId = nextNode(node.id, edgeIndex)
        sim.state = 'paused'
    }
  } catch (err) {
    sim.errorMessage = err instanceof Error ? err.message : String(err)
    sim.state = 'error'
    setActive(null, nodes)
    return
  }

  // Infinite-loop guard
  if (sim.state === 'paused' || sim.state === 'running') {
    if (!nextId) {
      sim.state = 'done'
      setActive(null, nodes)
      return
    }
    sim.stepCount++
    if (sim.stepCount > MAX_STEPS) {
      sim.errorMessage = `Se superó el límite de ${MAX_STEPS} pasos. Posible bucle infinito.`
      sim.state = 'error'
      setActive(null, nodes)
      return
    }
    sim.currentNodeId = nextId
  }
}

// ─── Input request (async, resolved by UI) ────────────────────────────────────

function requestInput(prompt: string, sim: ReturnType<typeof useSimulationStore>): Promise<string> {
  sim.inputPrompt = prompt
  sim.state = 'waiting_input'
  return new Promise((resolve) => {
    sim.inputResolver = resolve
  })
}

// ─── Parsing helpers ──────────────────────────────────────────────────────────

/**
 * Extract the target variable name from an Input node label.
 * Accepts: "Leer x", "leer x", "Read x", "x", "Ingresar nombre"
 */
function parseInputTarget(label: string): string | null {
  const cleaned = label.trim()
  // "Leer x", "leer nombre", "Read x", "Ingresar x", "Ingrese x"
  const keywordMatch = cleaned.match(/^(?:leer|read|ingresar|ingrese)\s+([A-Za-z_]\w*)/i)
  if (keywordMatch) return keywordMatch[1]
  // Bare identifier
  const bareMatch = cleaned.match(/^([A-Za-z_]\w*)$/)
  if (bareMatch) return bareMatch[1]
  return null
}

/**
 * Try to parse a user-input string into a number or boolean; fall back to string.
 */
function parseValue(raw: string): unknown {
  const trimmed = raw.trim()
  if (trimmed === 'true') return true
  if (trimmed === 'false') return false
  const num = Number(trimmed)
  if (!isNaN(num) && trimmed !== '') return num
  return trimmed
}

/**
 * Evaluate an Output node label as a template string.
 * Supports: plain expression ("x + 1"), or quoted text with embedded {{expr}}.
 */
function evaluateOutputLabel(label: string, context: VarMap): string {
  const trimmed = label.trim()
  // If it contains {{ }}, treat as a string template
  if (trimmed.includes('{{')) {
    return trimmed.replace(/\{\{(.+?)\}\}/g, (_, expr) => {
      try {
        return String(evaluate(expr.trim(), context))
      } catch {
        return `[error: ${expr}]`
      }
    })
  }
  // Otherwise treat as a jexl expression and stringify the result
  try {
    return String(evaluate(trimmed, context))
  } catch {
    return trimmed
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
