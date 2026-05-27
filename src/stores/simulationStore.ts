import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { VarMap } from '@/utils/evaluator'

export type SimState = 'idle' | 'running' | 'paused' | 'waiting_input' | 'done' | 'error'

export interface OutputEntry {
  id: string
  text: string
}

export const useSimulationStore = defineStore('simulation', () => {
  const state = ref<SimState>('idle')
  const currentNodeId = ref<string | null>(null)
  const variables = ref<VarMap>({})
  const outputLog = ref<OutputEntry[]>([])
  const errorMessage = ref<string | null>(null)
  const stepCount = ref(0)

  /** Pending input request: resolver called by the UI when the user submits a value. */
  const inputResolver = ref<((value: string) => void) | null>(null)
  const inputPrompt = ref<string>('')

  /** User-curated watch list — persists across resets so it survives multiple simulation runs. */
  const watchedVars = ref<string[]>([])

  const isActive = computed(() => state.value !== 'idle' && state.value !== 'done' && state.value !== 'error')

  function reset() {
    state.value = 'idle'
    currentNodeId.value = null
    variables.value = {}
    outputLog.value = []
    errorMessage.value = null
    inputResolver.value = null
    inputPrompt.value = ''
    stepCount.value = 0
    // watchedVars intentionally NOT reset — user keeps their watch list across runs
  }

  function appendOutput(text: string) {
    outputLog.value.push({ id: crypto.randomUUID(), text })
  }

  function resolveInput(value: string) {
    if (inputResolver.value) {
      inputResolver.value(value)
      inputResolver.value = null
    }
  }

  function clearOutput() {
    outputLog.value = []
  }

  function addWatch(name: string) {
    const trimmed = name.trim()
    if (trimmed && !watchedVars.value.includes(trimmed)) {
      watchedVars.value.push(trimmed)
    }
  }

  function removeWatch(name: string) {
    watchedVars.value = watchedVars.value.filter((v) => v !== name)
  }

  function clearWatches() {
    watchedVars.value = []
  }

  return {
    state,
    currentNodeId,
    variables,
    outputLog,
    errorMessage,
    inputResolver,
    inputPrompt,
    isActive,
    stepCount,
    watchedVars,
    reset,
    appendOutput,
    clearOutput,
    resolveInput,
    addWatch,
    removeWatch,
    clearWatches,
  }
})
