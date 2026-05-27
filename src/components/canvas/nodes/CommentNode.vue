<template>
  <!-- Annotation-only block: dashed border, ignored by simulator -->
  <div
    class="cmt-node"
    :class="{ 'cmt-node--selected': selected }"
    @dblclick.stop="startEdit"
  >
    <Handle type="source" :position="Position.Top"    id="top"    />
    <Handle type="source" :position="Position.Right"  id="right"  />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
    <Handle type="source" :position="Position.Left"   id="left"   />
    <span v-if="!editing" class="cmt-label">{{ data.label }}</span>
    <textarea
      v-else
      ref="textareaRef"
      v-model="localLabel"
      class="cmt-textarea nodrag nopan"
      rows="3"
      @blur="endEdit"
      @keyup.escape="cancelEdit"
      @keydown.enter.ctrl="endEdit"
      @click.stop
      @mousedown.stop
    />
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { FlowNodeData } from '@/types'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  data: FlowNodeData
  selected?: boolean
}>()

const { updateNodeData } = useVueFlow()
const editing = ref(false)
const localLabel = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

async function startEdit() {
  localLabel.value = props.data.label
  editing.value = true
  await nextTick()
  textareaRef.value?.focus()
  textareaRef.value?.select()
}

function endEdit() {
  if (!editing.value) return
  updateNodeData(props.id, { ...props.data, label: localLabel.value.trim() || props.data.label })
  editing.value = false
}

function cancelEdit() {
  editing.value = false
}
</script>

<style scoped>
.cmt-node {
  min-width: 160px;
  min-height: 55px;
  border: 2px dashed #9E9E9E;
  background: #FAFAFA;
  border-radius: 4px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  user-select: none;
  position: relative;
  transition: border-color 0.15s;
}
/* Fold corner decoration */
.cmt-node::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 14px;
  height: 14px;
  background: linear-gradient(225deg, #BDBDBD 50%, transparent 50%);
  border-radius: 0 4px 0 0;
}
.cmt-node--selected {
  border-color: #1565C0;
}
.cmt-label {
  font-size: 12px;
  font-style: italic;
  color: #616161;
  pointer-events: none;
  white-space: pre-wrap;
  text-align: center;
  word-break: break-word;
}
.cmt-textarea {
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-size: 12px;
  font-style: italic;
  color: #616161;
  text-align: center;
  width: 100%;
  font-family: inherit;
  padding: 0;
}
</style>
