<script setup lang="ts">
import { shallowRef, computed, onMounted, onUnmounted } from 'vue'
import { useCandidats } from '@/composables/useCandidats'
import { usePdf } from '@/composables/usePdf'
import { useTheme } from '@/composables/useTheme'
import FileDropzone from './FileDropzone.vue'
import LoadingScreen from './LoadingScreen.vue'
import CandidatSidebar from './CandidatSidebar.vue'
import CandidatDetail from './CandidatDetail.vue'
import TutorialOverlay from './TutorialOverlay.vue'
import { useTutorial } from '@/composables/useTutorial'

const {
  headers, candidats, selectedCandidat, selectedIndex, hasData, displayCols,
  loadFile, updateEvaluation, exportFile, select, selectPrev, selectNext,
} = useCandidats()

const { pdfDoc, hasPdf, isPdfParsing, loadPdf, getDossierRange, isSearching } = usePdf()

const { isDark, toggle: toggleTheme } = useTheme()
const { open: openTutorial } = useTutorial()
const fileName = shallowRef('')

// État dérivé — source unique de vérité
const appState = computed<'idle' | 'loading' | 'ready'>(() => {
  if (!hasData.value || !hasPdf.value) return 'idle'
  if (isPdfParsing.value) return 'loading'
  return 'ready'
})

const currentPdfRange = computed(() => {
  if (!selectedCandidat.value || !hasPdf.value) return null
  const code = selectedCandidat.value.raw[3]
  return code != null ? getDossierRange(String(code)) : null
})

const isPdfSearching = computed(() => {
  if (!selectedCandidat.value) return false
  const code = selectedCandidat.value.raw[3]
  return code != null ? isSearching(String(code)) : false
})

async function onXlsxLoaded(file: File, name: string) {
  fileName.value = name
  await loadFile(file)
}

function onKeyDown(e: KeyboardEvent) {
  if (appState.value !== 'ready') return
  if (e.key === 'ArrowUp') { e.preventDefault(); selectPrev() }
  if (e.key === 'ArrowDown') { e.preventDefault(); selectNext() }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="flex h-screen bg-slate-900 text-white overflow-hidden">
    <TutorialOverlay />

    <!-- Idle : chargement des fichiers -->
    <div v-if="appState === 'idle'" class="flex-1 p-8">
      <FileDropzone
        :has-xlsx="hasData"
        :has-pdf="hasPdf"
        @xlsx-loaded="onXlsxLoaded"
        @pdf-loaded="loadPdf"
      />
    </div>

    <!-- Chargement PDF en cours -->
    <div v-else-if="appState === 'loading'" class="flex-1">
      <LoadingScreen />
    </div>

    <!-- Dashboard -->
    <template v-else>
      <aside class="w-72 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <span class="text-indigo-400 font-bold text-sm tracking-tight">ParcoursScore</span>
          <div class="flex items-center gap-2">
            <button
              class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              title="Guide d'utilisation"
              @click="openTutorial"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </button>
            <button
              class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
              :title="isDark ? 'Thème clair' : 'Thème sombre'"
              @click="toggleTheme"
            >
              <!-- Sun -->
              <svg v-if="isDark" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z"/>
              </svg>
              <!-- Moon -->
              <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
              </svg>
            </button>
            <button
              class="text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-3 py-1.5 rounded-lg text-white font-medium transition-colors"
              @click="exportFile(fileName)"
            >Exporter</button>
          </div>
        </div>
        <CandidatSidebar
          :candidats="candidats"
          :selected-index="selectedIndex"
          :display-cols="displayCols"
          @select="select"
        />
      </aside>

      <div class="flex-1 flex flex-col overflow-hidden">
        <nav class="px-5 py-2 border-b border-slate-700 bg-slate-900 flex items-center gap-3 flex-shrink-0">
          <button
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            :disabled="selectedIndex === 0"
            @click="selectPrev"
          >← Précédent</button>

          <span class="text-slate-500 text-sm tabular-nums">
            {{ selectedIndex + 1 }} / {{ candidats.length }}
          </span>

          <button
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            :disabled="selectedIndex === candidats.length - 1"
            @click="selectNext"
          >Suivant →</button>

          <span class="ml-auto text-slate-600 text-xs truncate max-w-48" :title="fileName">{{ fileName }}</span>
        </nav>

        <main class="flex-1 overflow-hidden">
          <CandidatDetail
            v-if="selectedCandidat"
            :candidat="selectedCandidat"
            :headers="headers"
            :display-cols="displayCols"
            :pdf-doc="pdfDoc"
            :pdf-range="currentPdfRange"
            :is-pdf-searching="isPdfSearching"
            @update-evaluation="updateEvaluation(selectedIndex, $event)"
          />
        </main>
      </div>
    </template>
  </div>
</template>
