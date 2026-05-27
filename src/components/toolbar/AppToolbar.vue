<template>
  <v-app-bar color="primary" density="compact" elevation="2">
    <v-app-bar-title>
      <v-text-field
        v-model="store.flowName"
        variant="plain"
        density="compact"
        hide-details
        single-line
        class="flow-name-field"
        @click.stop
      />
    </v-app-bar-title>

    <template #append>
      <!-- New flow -->
      <v-tooltip text="Nuevo diagrama" location="bottom">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" :disabled="store.mode === 'simulation'" @click="emit('new')">
            <v-icon>mdi-file-plus-outline</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <!-- Save -->
      <v-tooltip text="Guardar (Ctrl+S)" location="bottom">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" @click="emit('save')">
            <v-icon>mdi-content-save</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <!-- Load -->
      <v-tooltip text="Cargar (JSON)" location="bottom">
        <template #activator="{ props }">
          <v-btn icon v-bind="props" :disabled="store.mode === 'simulation'" @click="emit('load')">
            <v-icon>mdi-folder-open</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-divider vertical class="mx-1 my-1" />

      <!-- Snap to grid toggle -->
      <v-tooltip :text="store.snapToGrid ? 'Desactivar cuadrícula' : 'Ajustar a cuadrícula'" location="bottom">
        <template #activator="{ props }">
          <v-btn
            icon v-bind="props"
            :color="store.snapToGrid ? 'white' : undefined"
            :variant="store.snapToGrid ? 'tonal' : 'text'"
            @click="store.snapToGrid = !store.snapToGrid"
          >
            <v-icon>mdi-grid</v-icon>
          </v-btn>
        </template>
      </v-tooltip>

      <v-divider vertical class="mx-1 my-1" />

      <!-- Simulate / Edit toggle -->
      <v-btn
        :color="store.mode === 'simulation' ? 'success' : undefined"
        :variant="store.mode === 'simulation' ? 'tonal' : 'text'"
        prepend-icon="mdi-play-circle-outline"
        size="small"
        class="mr-1"
        @click="toggleMode"
      >
        {{ store.mode === 'edit' ? 'Simular' : 'Editar' }}
      </v-btn>
    </template>
  </v-app-bar>
</template>

<script setup lang="ts">
import { useFlowStore } from '@/stores/flowStore'
import { resetSimulation } from '@/utils/simulator'

const emit = defineEmits<{ save: []; load: []; new: [] }>()

const store = useFlowStore()

function toggleMode() {
  if (store.mode === 'simulation') {
    resetSimulation()
  }
  store.mode = store.mode === 'edit' ? 'simulation' : 'edit'
}
</script>

<style scoped>
.flow-name-field :deep(input) {
  color: white !important;
  caret-color: white;
  font-size: 1rem;
  font-weight: 500;
}
</style>
