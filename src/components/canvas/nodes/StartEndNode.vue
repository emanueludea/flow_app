<template>
  <div
    class="se-node"
    :class="{
      'se-node--start': isStart,
      'se-node--end': !isStart,
      'se-node--active': data.isActive,
      'se-node--selected': selected,
    }"
    @dblclick.stop="startEdit"
  >
    <Handle type="source" :position="Position.Top"    id="top"    />
    <Handle type="source" :position="Position.Right"  id="right"  />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
    <Handle type="source" :position="Position.Left"   id="left"   />
    <span v-if="!editing" class="se-label">{{ data.label }}</span>
    <input
      v-else
      ref="inputRef"
      v-model="localLabel"
      class="se-input nodrag"
      @blur="endEdit"
      @keyup.enter="endEdit"
      @keyup.escape="cancelEdit"
      @click.stop
      @mousedown.stop
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import type { FlowNodeData } from '@/types'

defineOptions({ inheritAttrs: false })

const props = defineProps<{
  id: string
  data: FlowNodeData
  selected?: boolean
}>()

const isStart = computed(() => props.data.variant === 'start')
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
.se-node {
  min-width: 120px;
  height: 44px;
  border-radius: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: default;
  user-select: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  border: 2px solid transparent;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.se-node--start { background: #2E7D32; }
.se-node--end   { background: #B71C1C; }
.se-node--active {
  box-shadow: 0 0 0 3px #FFD600, 0 2px 5px rgba(0, 0, 0, 0.3);
}
.se-node--selected {
  border-color: #1565C0;
  box-shadow: 0 0 0 2px #1565C0;
}
.se-label { pointer-events: none; white-space: nowrap; }
.se-input {
  background: transparent;
  border: none;
  border-bottom: 2px solid rgba(255,255,255,0.8);
  outline: none;
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  width: 100%;
  padding: 0;
}
</style>
