import type { Node, Edge } from '@vue-flow/core'
import { MarkerType } from '@vue-flow/core'

const FILE_VERSION = 1

export interface FlowFile {
  version: number
  name: string
  nodes: Node[]
  edges: Edge[]
}

export function exportFlow(name: string, nodes: Node[], edges: Edge[]): void {
  const payload: FlowFile = { version: FILE_VERSION, name, nodes, edges }
  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${sanitizeFilename(name)}.json`
  anchor.click()

  URL.revokeObjectURL(url)
}

export function importFlow(file: File): Promise<FlowFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const raw = JSON.parse(e.target?.result as string)
        if (!isValidFlowFile(raw)) {
          reject(new Error('Archivo inválido: formato no reconocido.'))
          return
        }
        resolve(migrateHandles(raw as FlowFile))
      } catch {
        reject(new Error('Archivo inválido: no es un JSON válido.'))
      }
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsText(file)
  })
}

function isValidFlowFile(obj: unknown): obj is FlowFile {
  if (!obj || typeof obj !== 'object') return false
  const f = obj as Record<string, unknown>
  return (
    typeof f.version === 'number' &&
    typeof f.name === 'string' &&
    Array.isArray(f.nodes) &&
    Array.isArray(f.edges)
  )
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-. ]/g, '_').trim() || 'flow'
}

const BRANCH_YES_STYLE = { stroke: '#2e7d32', strokeWidth: 2 }
const BRANCH_NO_STYLE  = { stroke: '#c62828', strokeWidth: 2 }
const BRANCH_YES_LABEL_STYLE = { fontWeight: 700, fontSize: 12, fill: '#1b5e20' }
const BRANCH_NO_LABEL_STYLE  = { fontWeight: 700, fontSize: 12, fill: '#b71c1c' }
const BRANCH_YES_BG_STYLE = { fill: '#e8f5e9', stroke: '#2e7d32', strokeWidth: 1.5, rx: 4, ry: 4 }
const BRANCH_NO_BG_STYLE  = { fill: '#ffebee', stroke: '#c62828', strokeWidth: 1.5, rx: 4, ry: 4 }

/** Apply branch-specific visual styling to a decision edge. */
function applyBranchStyle(e: Edge): Edge {
  const data = e.data as Record<string, unknown> | undefined
  const branch = data?.branch
  if (branch === 'yes') {
    return {
      ...e,
      style: BRANCH_YES_STYLE,
      labelStyle: BRANCH_YES_LABEL_STYLE,
      labelBgStyle: BRANCH_YES_BG_STYLE,
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2e7d32' },
    }
  }
  if (branch === 'no') {
    return {
      ...e,
      style: BRANCH_NO_STYLE,
      labelStyle: BRANCH_NO_LABEL_STYLE,
      labelBgStyle: BRANCH_NO_BG_STYLE,
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 4,
      markerEnd: { type: MarkerType.ArrowClosed, color: '#c62828' },
    }
  }
  return e
}

/** Migrate handle IDs from old naming schemes to the current (top/right/bottom/left). */
function migrateHandles(flow: FlowFile): FlowFile {
  function mapHandle(h: string | null | undefined): string | null | undefined {
    if (!h) return h
    if (h === 'output' || h === 'out-bottom' || h === 'in-bottom') return 'bottom'
    if (h === 'input'  || h === 'in-top'    || h === 'out-top')    return 'top'
    if (h === 'out-right' || h === 'in-right') return 'right'
    if (h === 'out-left'  || h === 'in-left')  return 'left'
    if (h === 'yes'  || h.startsWith('yes-')) return 'right'
    if (h === 'no'   || h.startsWith('no-'))  return 'bottom'
    return h
  }

  /** Infer branch data for decision edges that pre-date data.branch. */
  function inferBranch(e: Edge): { branch: 'yes' | 'no' } | undefined {
    const data = e.data as Record<string, unknown> | undefined
    if (data?.branch === 'yes' || data?.branch === 'no') return undefined // already present
    const sh = e.sourceHandle as string | undefined
    const lbl = e.label as string | undefined
    if (sh === 'yes' || (sh && sh.startsWith('yes-')) || lbl === 'Sí' || lbl === 'Si') return { branch: 'yes' }
    if (sh === 'no'  || (sh && sh.startsWith('no-'))  || lbl === 'No') return { branch: 'no' }
    return undefined
  }

  const edges = flow.edges.map((e) => {
    const inferred = inferBranch(e)
    const migrated = {
      ...e,
      sourceHandle: mapHandle(e.sourceHandle),
      targetHandle: mapHandle(e.targetHandle),
      ...(inferred ? { data: { ...(e.data as object ?? {}), ...inferred } } : {}),
    }
    return applyBranchStyle(migrated)
  })
  return { ...flow, edges }
}
