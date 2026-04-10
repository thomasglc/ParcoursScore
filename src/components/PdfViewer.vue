<script setup lang="ts">
import { shallowRef, computed, watch, useTemplateRef, onMounted } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'

const props = defineProps<{
  pdfDoc: PDFDocumentProxy
  startPage: number
  endPage: number
}>()

const currentPage = shallowRef(props.startPage)
const isRendering = shallowRef(false)
const containerRef = useTemplateRef<HTMLDivElement>('container')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

const pageCount = computed(() => props.endPage - props.startPage + 1)
const pageInDossier = computed(() => currentPage.value - props.startPage + 1)

watch(() => props.startPage, (p) => { currentPage.value = p })
watch(currentPage, renderPage)
onMounted(renderPage)

async function renderPage() {
  if (!canvasRef.value) return
  isRendering.value = true
  const page = await props.pdfDoc.getPage(currentPage.value)
  const containerWidth = containerRef.value?.clientWidth ?? 400
  const base = page.getViewport({ scale: 1 })
  const scale = Math.min((containerWidth - 16) / base.width, 2)
  const viewport = page.getViewport({ scale })
  const canvas = canvasRef.value
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas: canvasRef.value! }).promise
  isRendering.value = false
}
</script>

<template>
  <div ref="container" class="flex flex-col h-full bg-slate-950">
    <!-- Toolbar -->
    <div class="flex items-center gap-2 px-3 py-2 border-b border-slate-700 flex-shrink-0">
      <button
        class="w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentPage <= startPage"
        @click="currentPage--"
      >←</button>
      <span class="text-slate-400 text-xs tabular-nums">{{ pageInDossier }} / {{ pageCount }}</span>
      <button
        class="w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
        :disabled="currentPage >= endPage"
        @click="currentPage++"
      >→</button>
      <div v-if="isRendering" class="ml-auto flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
        <span class="text-slate-500 text-xs">Chargement</span>
      </div>
    </div>

    <!-- Canvas -->
    <div class="flex-1 overflow-auto flex justify-center py-3 px-2">
      <canvas ref="canvas" class="shadow-2xl rounded" />
    </div>
  </div>
</template>
