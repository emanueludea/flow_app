<template>
  <div
    class="proc-node"
    :class="{
      'proc-node--active': data.isActive,
      'proc-node--selected': selected,
    }"
    @dblclick.stop="startEdit"
  >
    <Handle type="source" :position="Position.Top"    id="top"    />
    <Handle type="source" :position="Position.Right"  id="right"  />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
    <Handle type="source" :position="Position.Left"   id="left"   />
    <span v-if="!editing" class="proc-label">{{ data.label }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="localLabel"
      class="proc-input nodrag"
      @blur="endEdit"
      @keyup.enter="endEdit"
      @keyup.escape="cancelEdit"
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
const inputRef = ref<HTMLInputElement | null>(null)

async function startEdit() {
  localLabel.value = props.data.label
  editing.value = true
  await nextTick()
  inputRef.value?.focus()
  inputRef.value?.select()
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
.proc-node {
  min-width: 150px;
  min-height: 50px;
  background: #E3F2FD;
  border: 2px solid #1565C0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  cursor: default;
  user-select: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.proc-node--active {
  background: #FFF9C4;
  border-color: #F9A825;
  box-shadow: 0 0 0 3px #FFD600;
}
.proc-node--selected {
  border-color: #0D47A1;
  box-shadow: 0 0 0 2px #1565C0;
}
.proc-label {
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  color: #0D47A1;
  pointer-events: none;
  white-space: nowrap;
}
.proc-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid #1565C0;
  outline: none;
  font-size: 13px;
  font-family: 'Roboto Mono', monospace;
  color: #0D47A1;
  text-align: center;
  width: 100%;
  padding: 0;
}
</style>
