<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

const props = defineProps<{
  hasXlsx: boolean
  hasPdf: boolean
}>()

const emit = defineEmits<{
  xlsxLoaded: [file: File, name: string]
  pdfLoaded: [file: File]
}>()

const isDragging = shallowRef(false)
const xlsxInput = useTemplateRef<HTMLInputElement>('xlsxInput')
const pdfInput = useTemplateRef<HTMLInputElement>('pdfInput')

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  for (const f of files) {
    if (f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) emit('xlsxLoaded', f, f.name)
    else if (f.name.endsWith('.pdf')) emit('pdfLoaded', f)
  }
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center h-full gap-6 transition-colors"
    :class="isDragging ? 'bg-indigo-950/20' : ''"
    @dragover.prevent="isDragging = true"
    @dragleave="isDragging = false"
    @drop.prevent="onDrop"
  >
    <div class="text-center">
      <span class="text-indigo-400 text-2xl font-bold tracking-tight">ParcoursScore</span>
      <p class="text-slate-500 text-sm mt-1">Évaluation Parcoursup — BTS SIO</p>
    </div>

    <!-- File slots -->
    <div class="flex gap-4">
      <!-- XLSX -->
      <div
        class="w-52 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
        :class="hasXlsx
          ? 'border-emerald-500/60 bg-emerald-950/30'
          : isDragging ? 'border-indigo-400 bg-indigo-950/30' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800/60'"
        @click="!hasXlsx && xlsxInput?.click()"
      >
        <div v-if="hasXlsx" class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-emerald-400 text-sm font-medium">XLSX chargé</p>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <svg class="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-slate-300 text-sm font-medium">Fichier XLSX</p>
          <p class="text-slate-600 text-xs">Liste des candidats</p>
        </div>
        <input ref="xlsxInput" type="file" accept=".xlsx,.xls" class="hidden"
          @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) emit('xlsxLoaded', f, f.name) }" />
      </div>

      <!-- PDF -->
      <div
        class="w-52 border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200"
        :class="hasPdf
          ? 'border-emerald-500/60 bg-emerald-950/30'
          : isDragging ? 'border-indigo-400 bg-indigo-950/30' : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800/60'"
        @click="!hasPdf && pdfInput?.click()"
      >
        <div v-if="hasPdf" class="flex flex-col items-center gap-2">
          <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg class="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p class="text-emerald-400 text-sm font-medium">PDF chargé</p>
        </div>
        <div v-else class="flex flex-col items-center gap-2">
          <svg class="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p class="text-slate-300 text-sm font-medium">Fichier PDF</p>
          <p class="text-slate-600 text-xs">Dossiers candidats</p>
        </div>
        <input ref="pdfInput" type="file" accept=".pdf" class="hidden"
          @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) emit('pdfLoaded', f) }" />
      </div>
    </div>

    <p class="text-slate-600 text-xs">Vous pouvez glisser les deux fichiers en même temps</p>
  </div>
</template>
