<template>
  <v-app>
    <AppToolbar @save="onSave" @load="onLoad" @new="newDialog = true" />
    <BlockPalette />
    <SimulationPanel />
    <v-main>
      <FlowCanvas />
    </v-main>

    <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onFileChange" />

    <!-- New flow confirmation dialog -->
    <v-dialog v-model="newDialog" max-width="380" persistent>
      <v-card>
        <v-card-title class="text-h6 pt-4 px-4 pb-0">Nuevo diagrama</v-card-title>
        <v-card-text class="pt-3 text-body-2">
          ¿Deseas crear un nuevo diagrama? Se perderán los cambios no guardados.
        </v-card-text>
        <v-card-actions class="justify-end pa-4 pt-2 gap-2">
          <v-btn variant="text" @click="newDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" @click="confirmNew">Nuevo</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500" location="bottom end">
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import AppToolbar from '@/components/toolbar/AppToolbar.vue'
import BlockPalette from '@/components/palette/BlockPalette.vue'
import SimulationPanel from '@/components/simulation/SimulationPanel.vue'
import FlowCanvas from '@/components/canvas/FlowCanvas.vue'
import { useFlowStore } from '@/stores/flowStore'
import { exportFlow, importFlow } from '@/utils/fileIO'
import { resetSimulation } from '@/utils/simulator'

const store = useFlowStore()
const fileInput = ref<HTMLInputElement | null>(null)
const newDialog = ref(false)

const snackbar = reactive({ show: false, message: '', color: 'error' })

function notify(message: string, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

// ─── Save / Load ─────────────────────────────────────────────────────────────

function onSave() {
  try {
    exportFlow(store.flowName, store.nodes, store.edges)
    notify('Flujo guardado correctamente.')
  } catch {
    notify('Error al guardar el flujo.')
  }
}

function onLoad() {
  fileInput.value?.click()
}

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  ;(event.target as HTMLInputElement).value = ''
  try {
    const flow = await importFlow(file)
    store.setNodes(flow.nodes)
    store.setEdges(flow.edges)
    store.flowName = flow.name
    notify(`"${flow.name}" cargado correctamente.`)
  } catch (err) {
    notify(err instanceof Error ? err.message : 'Error al cargar el archivo.', 'error')
  }
}

// ─── New flow ─────────────────────────────────────────────────────────────────

function confirmNew() {
  resetSimulation()
  store.reset()
  newDialog.value = false
  notify('Nuevo diagrama creado.')
}

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

function onKeyDown(e: KeyboardEvent) {
  const ctrl = e.ctrlKey || e.metaKey
  if (ctrl && e.key === 's') {
    e.preventDefault()
    onSave()
  }
}

onMounted(() => document.addEventListener('keydown', onKeyDown))
onUnmounted(() => document.removeEventListener('keydown', onKeyDown))
</script>

