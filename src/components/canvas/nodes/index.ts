import type { Component } from 'vue'
import StartEndNode from './StartEndNode.vue'
import ProcessNode from './ProcessNode.vue'
import DecisionNode from './DecisionNode.vue'
import InputNode from './InputNode.vue'
import OutputNode from './OutputNode.vue'
import CommentNode from './CommentNode.vue'

// Cast as Record<string, Component> to avoid Vue Flow's built-in type name conflicts
// ('input' and 'output' are reserved in Vue Flow's NodeTypesObject)
export const nodeTypes: Record<string, Component> = {
  startEnd: StartEndNode,
  process: ProcessNode,
  decision: DecisionNode,
  input: InputNode,
  output: OutputNode,
  comment: CommentNode,
}

export { StartEndNode, ProcessNode, DecisionNode, InputNode, OutputNode, CommentNode }
