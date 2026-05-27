<template>
  <v-navigation-drawer
    :model-value="flowStore.mode === 'edit'"
    permanent
    width="188"
    color="grey-lighten-5"
    border="end"
  >
    <v-list-subheader class="text-uppercase font-weight-bold text-grey-darken-2 mt-1">
      Bloques
    </v-list-subheader>

    <div class="palette-list pa-2">
      <div
        v-for="block in blocks"
        :key="block.id"
        class="palette-item"
        draggable="true"
        @dragstart="(e) => onDragStart(e, block)"
        @dragend="dragging = false"
      >
        <v-icon :color="block.color" size="22" class="mr-2">{{ block.icon }}</v-icon>
        <span class="text-body-2">{{ block.name }}</span>
      </div>
    </div>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFlowStore } from '@/stores/flowStore'

interface BlockDef {
  id: string
  name: string
  icon: string
  color: string
  nodeType: string
  variant?: string
}

const blocks: BlockDef[] = [
  { id: 'start',    name: 'Inicio',     icon: 'mdi-circle',               nodeType: 'startEnd', variant: 'start', color: 'green-darken-1'  },
  { id: 'end',      name: 'Fin',        icon: 'mdi-circle',               nodeType: 'startEnd', variant: 'end',   color: 'red-darken-1'    },
  { id: 'process',  name: 'Proceso',    icon: 'mdi-rectangle-outline',    nodeType: 'process',                    color: 'blue-darken-1'   },
  { id: 'decision', name: 'Decisión',   icon: 'mdi-rhombus-outline',      nodeType: 'decision',                   color: 'orange-darken-1' },
  { id: 'input',    name: 'Entrada',    icon: 'mdi-tray-arrow-down',      nodeType: 'input',                      color: 'purple-darken-1' },
  { id: 'output',   name: 'Salida',     icon: 'mdi-tray-arrow-up',        nodeType: 'output',                     color: 'teal-darken-1'   },
  { id: 'comment',  name: 'Comentario', icon: 'mdi-comment-text-outline', nodeType: 'comment',                    color: 'grey-darken-1'   },
]

const dragging = ref(false)
const flowStore = useFlowStore()

function onDragStart(event: DragEvent, block: BlockDef) {
  if (!event.dataTransfer) return
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/nodeType', block.nodeType)
  event.dataTransfer.setData('application/nodeVariant', block.variant ?? '')
  dragging.value = true
}
</script>

<style scoped>
.palette-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: grab;
  user-select: none;
  transition: background-color 0.15s;
}

.palette-item:hover {
  background-color: rgba(0, 0, 0, 0.06);
}

.palette-item:active {
  cursor: grabbing;
}
</style>
