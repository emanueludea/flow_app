<template>
  <!-- Parallelogram via SVG polygon; 160×50 bounding box -->
  <div
    class="inp-outer"
    :class="{
      'inp-outer--active': data.isActive,
      'inp-outer--selected': selected,
    }"
    @dblclick.stop="startEdit"
  >
    <Handle type="source" :position="Position.Top"    id="top"    />
    <Handle type="source" :position="Position.Right"  id="right"  />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
    <Handle type="source" :position="Position.Left"   id="left"   />

    <svg width="160" height="50" class="inp-svg" aria-hidden="true">
      <polygon points="21,1 158,1 138,49 1,49" class="inp-poly" />
    </svg>

    <div class="inp-content">
      <span v-if="!editing" class="inp-label">{{ data.label }}</span>
      <input
        v-else
        ref="inputRef"
        v-model="localLabel"
        class="inp-input nodrag"
        @blur="endEdit"
        @keyup.enter="endEdit"
        @keyup.escape="cancelEdit"
        @click.stop
        @mousedown.stop
      />
    </div>
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
.inp-outer {
  width: 160px;
  height: 50px;
  position: relative;
  cursor: default;
  user-select: none;
}
.inp-svg {
  position: absolute;
  top: 0;
  left: 0;
}
.inp-poly {
  fill: #F3E5F5;
  stroke: #6A1B9A;
  stroke-width: 2;
  transition: fill 0.15s, stroke 0.15s;
}
.inp-outer--active .inp-poly {
  fill: #FFF9C4;
  stroke: #FFD600;
  stroke-width: 3;
}
.inp-outer--selected .inp-poly {
  stroke: #1565C0;
  stroke-width: 3;
}
.inp-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  padding: 4px 24px;
}
.inp-label {
  font-size: 13px;
  color: #4A148C;
  pointer-events: none;
  white-space: nowrap;
}
.inp-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #6A1B9A;
  outline: none;
  font-size: 13px;
  color: #4A148C;
  text-align: center;
  width: 100%;
  padding: 0;
}
</style>
