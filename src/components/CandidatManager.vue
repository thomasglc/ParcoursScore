<script setup lang="ts">
import { shallowRef, onMounted, onUnmounted } from 'vue'
import { useCandidats } from '@/composables/useCandidats'
import FileDropzone from './FileDropzone.vue'
import CandidatSidebar from './CandidatSidebar.vue'
import CandidatDetail from './CandidatDetail.vue'

const {
  headers,
  candidats,
  selectedCandidat,
  selectedIndex,
  hasData,
  displayCols,
  loadFile,
  updateEvaluation,
  exportFile,
  select,
  selectPrev,
  selectNext,
} = useCandidats()

const fileName = shallowRef('')

async function onFileLoaded(file: File, name: string) {
  fileName.value = name
  await loadFile(file)
}

function onKeyDown(e: KeyboardEvent) {
  if (!hasData.value) return
  if (e.key === 'ArrowUp') { e.preventDefault(); selectPrev() }
  if (e.key === 'ArrowDown') { e.preventDefault(); selectNext() }
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div class="flex h-screen bg-slate-900 text-white overflow-hidden">
    <!-- Empty state -->
    <div v-if="!hasData" class="flex-1 p-8">
      <FileDropzone @file-loaded="onFileLoaded" />
    </div>

    <!-- Dashboard layout -->
    <template v-else>
      <!-- Sidebar -->
      <aside class="w-72 flex-shrink-0 bg-slate-800 border-r border-slate-700 flex flex-col overflow-hidden">
        <!-- App header -->
        <div class="px-4 py-3 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <span class="text-indigo-400 font-bold text-sm tracking-tight">ParcoursScore</span>
          <button
            class="text-xs bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-3 py-1.5 rounded-lg text-white font-medium transition-colors"
            @click="exportFile(fileName)"
          >
            Exporter
          </button>
        </div>
        <CandidatSidebar
          :candidats="candidats"
          :selected-index="selectedIndex"
          :display-cols="displayCols"
          @select="select"
        />
      </aside>

      <!-- Main area -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Navigation bar -->
        <nav class="px-5 py-2.5 border-b border-slate-700 bg-slate-900 flex items-center gap-3 flex-shrink-0">
          <button
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-sm text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            :disabled="selectedIndex === 0"
            @click="selectPrev"
          >
            ← Précédent
          </button>

          <span class="text-slate-500 text-sm tabular-nums">
            {{ selectedIndex + 1 }} / {{ candidats.length }}
          </span>

          <button
            class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-sm text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            :disabled="selectedIndex === candidats.length - 1"
            @click="selectNext"
          >
            Suivant →
          </button>

          <span class="ml-auto text-slate-600 text-xs truncate max-w-48" :title="fileName">
            {{ fileName }}
          </span>
        </nav>

        <!-- Detail view -->
        <main class="flex-1 overflow-hidden">
          <CandidatDetail
            v-if="selectedCandidat"
            :candidat="selectedCandidat"
            :headers="headers"
            :display-cols="displayCols"
            @update-evaluation="updateEvaluation(selectedIndex, $event)"
          />
        </main>
      </div>
    </template>
  </div>
</template>
