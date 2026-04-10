<script setup lang="ts">
import { shallowRef, computed, watch, useTemplateRef, onMounted, onUnmounted, nextTick } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'

const props = defineProps<{
  pdfDoc: PDFDocumentProxy
  startPage: number
  endPage: number
}>()

const currentPage = shallowRef(props.startPage)
const isRendering = shallowRef(false)
const fullscreen = shallowRef(false)
const zoom = shallowRef(1) // multiplicateur relatif au fit-to-screen

const containerRef = useTemplateRef<HTMLDivElement>('container')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
const fsCanvasRef = useTemplateRef<HTMLCanvasElement>('fsCanvas')
const fsContainerRef = useTemplateRef<HTMLDivElement>('fsContainer')

const pageCount = computed(() => props.endPage - props.startPage + 1)
const pageInDossier = computed(() => currentPage.value - props.startPage + 1)
const zoomLabel = computed(() => Math.round(zoom.value * 100) + '%')

watch(() => props.startPage, (p) => { currentPage.value = p })
watch(currentPage, () => { renderPage(); if (fullscreen.value) renderFullscreen() })
watch(fullscreen, async (v) => {
  if (v) { zoom.value = 1.5; await nextTick(); renderFullscreen() }
})
watch(zoom, () => { if (fullscreen.value) renderFullscreen() })
onMounted(renderPage)

function onKeyDown(e: KeyboardEvent) {
  const tag = (e.target as HTMLElement).tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
  if (e.key === 'f' || e.key === 'F') { fullscreen.value = !fullscreen.value; return }
  if (!fullscreen.value) return
  if (e.key === 'Escape') fullscreen.value = false
  if (e.key === '+' || e.key === '=') zoomIn()
  if (e.key === '-') zoomOut()
  if (e.key === 'ArrowLeft' && currentPage.value > props.startPage) currentPage.value--
  if (e.key === 'ArrowRight' && currentPage.value < props.endPage) currentPage.value++
}
onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))

function zoomIn()  { zoom.value = Math.min(zoom.value + 0.25, 4) }
function zoomOut() { zoom.value = Math.max(zoom.value - 0.25, 0.5) }

async function renderToCanvas(canvas: HTMLCanvasElement, cssScale: number) {
  const page = await props.pdfDoc.getPage(currentPage.value)
  const dpr = window.devicePixelRatio || 1
  const renderScale = cssScale * dpr
  const viewport = page.getViewport({ scale: renderScale })
  canvas.width = viewport.width
  canvas.height = viewport.height
  canvas.style.width = `${viewport.width / dpr}px`
  canvas.style.height = `${viewport.height / dpr}px`
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
}

async function renderPage() {
  if (!canvasRef.value) return
  isRendering.value = true
  const page = await props.pdfDoc.getPage(currentPage.value)
  const base = page.getViewport({ scale: 1 })
  const containerWidth = containerRef.value?.clientWidth ?? 400
  const scale = (containerWidth - 16) / base.width
  await renderToCanvas(canvasRef.value, scale)
  isRendering.value = false
}

async function renderFullscreen() {
  if (!fsCanvasRef.value || !fsContainerRef.value) return
  const page = await props.pdfDoc.getPage(currentPage.value)
  const base = page.getViewport({ scale: 1 })
  const cw = fsContainerRef.value.clientWidth - 48
  const ch = fsContainerRef.value.clientHeight - 48
  const fitScale = Math.min(cw / base.width, ch / base.height)
  await renderToCanvas(fsCanvasRef.value, fitScale * zoom.value)
  fsContainerRef.value.scrollTop = 0
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
      <div v-if="isRendering" class="ml-2">
        <div class="w-3 h-3 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
      </div>
      <button
        class="ml-auto w-7 h-7 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
        title="Plein écran"
        @click="fullscreen = true"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      </button>
    </div>

    <!-- Canvas -->
    <div class="flex-1 overflow-auto flex justify-center py-3 px-2">
      <canvas ref="canvas" class="shadow-2xl rounded" />
    </div>
  </div>

  <!-- Fullscreen overlay -->
  <Teleport to="body">
    <div v-if="fullscreen" class="fixed inset-0 z-50 bg-black/95 flex flex-col">
      <!-- FS Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <!-- Zoom -->
        <div class="flex items-center gap-2">
          <button
            class="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="zoom <= 0.5"
            @click="zoomOut"
          >−</button>
          <span class="text-slate-400 text-sm tabular-nums w-12 text-center">{{ zoomLabel }}</span>
          <button
            class="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300 text-lg disabled:opacity-30 disabled:cursor-not-allowed"
            :disabled="zoom >= 4"
            @click="zoomIn"
          >+</button>
        </div>

        <span class="text-slate-500 text-sm tabular-nums ml-auto">{{ pageInDossier }} / {{ pageCount }}</span>

        <!-- Fermer -->
        <button
          class="w-8 h-8 flex items-center justify-center rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
          title="Fermer (Échap)"
          @click="fullscreen = false"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- FS Canvas + side nav -->
      <div class="flex-1 overflow-auto flex items-start justify-center relative p-6" ref="fsContainer">
        <!-- Prev -->
        <button
          class="sticky top-1/2 left-0 -translate-y-1/2 z-10 w-14 h-24 flex items-center justify-center rounded-l-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-4xl disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm transition-colors flex-shrink-0"
          :disabled="currentPage <= startPage"
          @click="currentPage--"
        >‹</button>

        <canvas ref="fsCanvas" class="shadow-2xl rounded mx-4 self-start" />

        <!-- Next -->
        <button
          class="sticky top-1/2 right-0 -translate-y-1/2 z-10 w-14 h-24 flex items-center justify-center rounded-r-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-4xl disabled:opacity-20 disabled:cursor-not-allowed backdrop-blur-sm transition-colors flex-shrink-0"
          :disabled="currentPage >= endPage"
          @click="currentPage++"
        >›</button>
      </div>
    </div>
  </Teleport>
</template>
