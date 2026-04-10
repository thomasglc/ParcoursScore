<script setup lang="ts">
import { shallowRef, useTemplateRef } from 'vue'

const emit = defineEmits<{
  fileLoaded: [file: File, name: string]
}>()

const isDragging = shallowRef(false)
const fileInput = useTemplateRef<HTMLInputElement>('fileInput')

function onDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) emit('fileLoaded', file, file.name)
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) emit('fileLoaded', file, file.name)
}

function triggerInput() {
  fileInput.value?.click()
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full gap-3">
    <div class="mb-4">
      <span class="text-indigo-400 text-2xl font-bold tracking-tight">ParcoursScore</span>
      <p class="text-slate-500 text-sm mt-1 text-center">Évaluation Parcoursup — BTS SIO</p>
    </div>

    <div
      class="w-full max-w-md border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-200"
      :class="isDragging
        ? 'border-indigo-400 bg-indigo-950/40 scale-[1.01]'
        : 'border-slate-600 hover:border-indigo-500 hover:bg-slate-800/60'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
      @click="triggerInput"
    >
      <svg class="mx-auto mb-4 w-12 h-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-slate-300 font-medium mb-1">Glisser-déposer le fichier XLSX</p>
      <p class="text-slate-500 text-sm">ou cliquer pour sélectionner</p>
      <input
        ref="fileInput"
        type="file"
        accept=".xlsx,.xls"
        class="hidden"
        @change="onFileInput"
      />
    </div>

    <p class="text-slate-600 text-xs">Formats acceptés : .xlsx, .xls</p>
  </div>
</template>
