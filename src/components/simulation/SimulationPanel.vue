<template>
  <!-- Right panel drawer -->
  <v-navigation-drawer
    :model-value="flowStore.mode === 'simulation'"
    location="end"
    permanent
    width="300"
    color="grey-lighten-5"
    border="start"
  >
    <div class="sim-panel">

      <!-- Header + status chip -->
      <div class="d-flex align-center justify-space-between px-3 pt-3 pb-1">
        <span class="text-subtitle-2 font-weight-bold text-grey-darken-3">Simulación</span>
        <v-chip :color="stateColor" size="small" label>{{ stateLabel }}</v-chip>
      </div>

      <!-- Control buttons -->
      <div class="d-flex align-center px-3 pb-2 gap-1">
        <v-tooltip text="Paso a paso" location="bottom">
          <template #activator="{ props }">
            <v-btn icon size="small" v-bind="props" :disabled="!canControl" @click="onStep">
              <v-icon>mdi-debug-step-over</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip :text="sim.state === 'running' ? 'Pausar' : 'Ejecutar'" location="bottom">
          <template #activator="{ props }">
            <v-btn
              icon size="small" v-bind="props"
              :disabled="sim.state === 'waiting_input'"
              @click="onPlayPause"
            >
              <v-icon>{{ sim.state === 'running' ? 'mdi-pause' : 'mdi-play' }}</v-icon>
            </v-btn>
          </template>
        </v-tooltip>

        <v-tooltip text="Reiniciar" location="bottom">
          <template #activator="{ props }">
            <v-btn icon size="small" v-bind="props" @click="onReset">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </template>
        </v-tooltip>
      </div>

      <!-- Error banner -->
      <v-alert
        v-if="sim.errorMessage"
        type="error"
        density="compact"
        variant="tonal"
        class="ma-2 mt-0"
        closable
        @click:close="onReset"
      >
        {{ sim.errorMessage }}
      </v-alert>

      <v-divider />

      <!-- ── Watch section ──────────────────────────────────────────────────── -->
      <div class="sim-section">
        <div class="d-flex align-center justify-space-between px-3 py-2">
          <span class="text-caption font-weight-bold text-uppercase text-grey-darken-2">Observar</span>
          <v-btn
            v-if="sim.watchedVars.length"
            icon size="x-small" variant="text"
            title="Limpiar lista"
            @click="sim.clearWatches()"
          >
            <v-icon size="14">mdi-playlist-remove</v-icon>
          </v-btn>
        </div>

        <!-- Add-watch input -->
        <div class="d-flex align-center px-3 pb-2 gap-1">
          <v-combobox
            v-model="watchInput"
            :items="watchSuggestions"
            density="compact"
            variant="outlined"
            hide-details
            placeholder="Nombre de variable"
            class="watch-input"
            @keyup.enter="addWatch"
          />
          <v-btn icon size="small" color="primary" :disabled="!watchInput.trim()" @click="addWatch">
            <v-icon>mdi-plus</v-icon>
          </v-btn>
        </div>

        <!-- Watch table -->
        <div v-if="sim.watchedVars.length === 0" class="text-caption text-grey-darken-1 px-3 pb-2 font-italic">
          Sin variables observadas.
        </div>
        <v-table v-else density="compact" class="sim-var-table">
          <tbody>
            <tr v-for="name in sim.watchedVars" :key="name" :class="{ 'watch-row--changed': changedVars.has(name) }">
              <td class="font-weight-medium text-mono watch-name">{{ name }}</td>
              <td class="text-right text-mono watch-val" :class="{ 'text-grey-lighten-1': !(name in sim.variables) }">
                {{ name in sim.variables ? displayVal(sim.variables[name]) : '—' }}
              </td>
              <td class="watch-remove-col">
                <v-btn icon size="x-small" variant="text" @click="sim.removeWatch(name)">
                  <v-icon size="14">mdi-close</v-icon>
                </v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
      </div>

      <v-divider />

      <!-- ── All variables (collapsible) ───────────────────────────────────── -->
      <div class="sim-section">
        <div
          class="d-flex align-center justify-space-between px-3 py-2 all-vars-header"
          @click="showAllVars = !showAllVars"
        >
          <span class="text-caption font-weight-bold text-uppercase text-grey-darken-2">
            Todas las variables
          </span>
          <div class="d-flex align-center gap-1">
            <v-chip size="x-small" color="blue-grey-lighten-2">{{ varEntries.length }}</v-chip>
            <v-icon size="16" class="text-grey-darken-1">
              {{ showAllVars ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </div>
        </div>

        <div v-show="showAllVars">
          <div v-if="varEntries.length === 0" class="text-caption text-grey-darken-1 px-3 pb-2 font-italic">
            Sin variables aún.
          </div>
          <v-table v-else density="compact" class="sim-var-table">
            <tbody>
              <tr v-for="[name, val] in varEntries" :key="name">
                <td class="font-weight-medium text-mono">{{ name }}</td>
                <td class="text-right text-mono">{{ displayVal(val) }}</td>
                <td class="watch-remove-col">
                  <v-btn
                    v-if="!sim.watchedVars.includes(name)"
                    icon size="x-small" variant="text"
                    title="Observar"
                    @click="sim.addWatch(name)"
                  >
                    <v-icon size="14">mdi-eye-plus-outline</v-icon>
                  </v-btn>
                  <v-icon v-else size="14" class="text-grey-lighten-1 px-1">mdi-eye-check</v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>

      <v-divider />

      <!-- ── Output log ─────────────────────────────────────────────────────── -->
      <div class="sim-section sim-output-section d-flex flex-column">
        <div class="d-flex align-center justify-space-between px-3 py-2">
          <span class="text-caption font-weight-bold text-uppercase text-grey-darken-2">Salida</span>
          <v-btn
            v-if="sim.outputLog.length"
            icon size="x-small"
            variant="text"
            title="Limpiar salida"
            @click="sim.clearOutput()"
          >
            <v-icon size="14">mdi-delete-outline</v-icon>
          </v-btn>
        </div>

        <div ref="outputContainer" class="sim-output-log px-3 pb-3">
          <div v-if="!sim.outputLog.length" class="text-caption text-grey-darken-1 font-italic">
            Sin salida aún.
          </div>
          <div
            v-for="entry in sim.outputLog"
            :key="entry.id"
            class="sim-output-entry text-body-2 text-mono"
          >
            {{ entry.text }}
          </div>
        </div>
      </div>

    </div>
  </v-navigation-drawer>

  <!-- Input dialog -->
  <v-dialog :model-value="sim.state === 'waiting_input'" persistent max-width="420">
    <v-card>
      <v-card-title class="text-h6 pt-4 px-4 pb-0">Entrada requerida</v-card-title>
      <v-card-text class="pt-3">
        <p class="text-body-2 text-grey-darken-1 mb-4">
          Bloque: <code class="text-mono bg-grey-lighten-3 px-1 rounded">{{ sim.inputPrompt }}</code>
        </p>
        <v-text-field
          v-model="inputValue"
          label="Ingrese el valor"
          variant="outlined"
          density="compact"
          autofocus
          hide-details
          @keyup.enter="submitInput"
        />
      </v-card-text>
      <v-card-actions class="justify-end pa-4 pt-2">
        <v-btn color="primary" variant="flat" @click="submitInput">Aceptar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useFlowStore } from '@/stores/flowStore'
import { useSimulationStore } from '@/stores/simulationStore'
import { runSimulation, pauseSimulation, resetSimulation } from '@/utils/simulator'

const flowStore = useFlowStore()
const sim = useSimulationStore()

// ─── State labels / colors ────────────────────────────────────────────────────

const STATE_LABEL: Record<string, string> = {
  idle:          'Listo',
  running:       'Ejecutando',
  paused:        'Pausado',
  waiting_input: 'Esperando entrada',
  done:          'Terminado',
  error:         'Error',
}

const STATE_COLOR: Record<string, string> = {
  idle:          'grey',
  running:       'blue',
  paused:        'orange',
  waiting_input: 'purple',
  done:          'success',
  error:         'error',
}

const stateLabel = computed(() => STATE_LABEL[sim.state] ?? sim.state)
const stateColor = computed(() => STATE_COLOR[sim.state] ?? 'grey')

// ─── Button guards ────────────────────────────────────────────────────────────

const canControl = computed(() =>
  sim.state !== 'running' && sim.state !== 'waiting_input'
)

// ─── Actions ─────────────────────────────────────────────────────────────────

function onStep()      { runSimulation('step') }
function onPlayPause() { sim.state === 'running' ? pauseSimulation() : runSimulation('play') }
function onReset()     { resetSimulation() }

// ─── Variable helpers ─────────────────────────────────────────────────────────

const varEntries = computed(() => Object.entries(sim.variables))

function displayVal(val: unknown): string {
  if (val === null || val === undefined) return '∅'
  if (typeof val === 'string') return `"${val}"`
  return String(val)
}

// Highlight rows that changed on the last step
const prevVars = ref<Record<string, unknown>>({})
const changedVars = ref<Set<string>>(new Set())

watch(
  () => ({ ...sim.variables }),
  (next, prev) => {
    const changed = new Set<string>()
    for (const k of Object.keys(next)) {
      if (prev[k] !== next[k]) changed.add(k)
    }
    changedVars.value = changed
    prevVars.value = prev
  },
  { deep: true }
)

// ─── Watch input ──────────────────────────────────────────────────────────────

const showAllVars = ref(true)
const watchInput = ref('')

const watchSuggestions = computed(() =>
  Object.keys(sim.variables).filter((k) => !sim.watchedVars.includes(k))
)

function addWatch() {
  if (!watchInput.value.trim()) return
  sim.addWatch(watchInput.value)
  watchInput.value = ''
}

// ─── Output log auto-scroll ───────────────────────────────────────────────────

const outputContainer = ref<HTMLElement | null>(null)

watch(
  () => sim.outputLog.length,
  async () => {
    await nextTick()
    if (outputContainer.value) {
      outputContainer.value.scrollTop = outputContainer.value.scrollHeight
    }
  }
)

// ─── Input dialog ─────────────────────────────────────────────────────────────

const inputValue = ref('')

watch(
  () => sim.state,
  (s) => { if (s === 'waiting_input') inputValue.value = '' }
)

function submitInput() {
  const val = inputValue.value.trim()
  sim.resolveInput(val)
  inputValue.value = ''
}
</script>

<style scoped>
.sim-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sim-section {
  flex-shrink: 0;
}

.sim-output-section {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.sim-output-log {
  overflow-y: auto;
  max-height: 100%;
  min-height: 40px;
}

.sim-output-entry {
  padding: 2px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;
  word-break: break-all;
}

.sim-var-table :deep(td) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  font-size: 13px;
}

.watch-name  { width: 40%; }
.watch-val   { width: 45%; }
.watch-remove-col { width: 30px; padding: 0 4px !important; }

.watch-row--changed td {
  background-color: #FFF9C4 !important;
  transition: background-color 0.8s ease-out;
}

.all-vars-header {
  cursor: pointer;
  user-select: none;
}
.all-vars-header:hover {
  background: rgba(0, 0, 0, 0.04);
}

.watch-input {
  font-size: 13px;
}

.text-mono {
  font-family: 'Courier New', Courier, monospace;
}

.gap-1 {
  gap: 4px;
}
</style>
