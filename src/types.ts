export interface FlowNodeData {
  label: string
  isActive?: boolean
  variant?: 'start' | 'end' // only used by startEnd node type
}
