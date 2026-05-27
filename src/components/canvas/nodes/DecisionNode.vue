<template>
  <!-- 120×120 wrapper; SVG diamond fills it; label overlay centered on top -->
  <div
    class="dec-outer"
    :class="{
      'dec-outer--active': data.isActive,
      'dec-outer--selected': selected,
    }"
    @dblclick.stop="startEdit"
  >
    <!-- 4 identical handles — any side can be input or output -->
    <Handle type="source" :position="Position.Top"    id="top"    />
    <Handle type="source" :position="Position.Right"  id="right"  />
    <Handle type="source" :position="Position.Bottom" id="bottom" />
    <Handle type="source" :position="Position.Left"   id="left"   />

    <svg width="120" height="120" class="dec-svg" aria-hidden="true">
      <polygon :points="diamondPoints" class="dec-poly" />
    </svg>

    <div class="dec-content">
      <span v-if="!editing" class="dec-label">{{ data.label }}</span>
      <input
        v-else
        ref="inputRef"
        v-model="localLabel"
        class="dec-input nodrag"
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
import { ref, nextTick, computed } from 'vue'
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

// Diamond points: top, right, bottom, left (1px inset for visible border)
const diamondPoints = computed(() =>
  props.data.isActive
    ? '60,2 118,60 60,118 2,60'
    : '60,2 118,60 60,118 2,60'
)

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
.dec-outer {
  width: 120px;
  height: 120px;
  position: relative;
  cursor: default;
  user-select: none;
}
.dec-svg {
  position: absolute;
  top: 0;
  left: 0;
}
.dec-poly {
  fill: #FFF8E1;
  stroke: #E65100;
  stroke-width: 2;
  transition: fill 0.15s, stroke 0.15s;
}
.dec-outer--active .dec-poly {
  fill: #FFF9C4;
  stroke: #FFD600;
  stroke-width: 3;
}
.dec-outer--selected .dec-poly {
  stroke: #1565C0;
  stroke-width: 3;
}
.dec-content {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 22px;
  z-index: 1;
}
.dec-label {
  font-size: 12px;
  font-weight: 500;
  color: #BF360C;
  pointer-events: none;
  word-break: break-word;
  line-height: 1.3;
}
.dec-input {
  background: transparent;
  border: none;
  border-bottom: 1px solid #E65100;
  outline: none;
  font-size: 12px;
  color: #BF360C;
  text-align: center;
  width: 70px;
  padding: 0;
}

</style>
