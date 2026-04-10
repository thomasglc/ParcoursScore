<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import type { CandidatRow, RawRow, DisplayCols, EvaluationData } from '@/composables/useCandidats'
import type { DossierRange } from '@/composables/usePdf'
import PdfViewer from './PdfViewer.vue'

const props = defineProps<{
  candidat: CandidatRow
  headers: RawRow
  displayCols: DisplayCols
  pdfDoc: PDFDocumentProxy | null
  pdfRange: DossierRange | null
  isPdfSearching: boolean
}>()

const emit = defineEmits<{
  updateEvaluation: [data: EvaluationData]
}>()

const form = reactive<EvaluationData>({
  noteNiveau: props.candidat.noteNiveau,
  noteComportement: props.candidat.noteComportement,
  noteMotivation: props.candidat.noteMotivation,
  remarque: props.candidat.remarque,
})

watch(() => props.candidat, (c) => {
  form.noteNiveau = c.noteNiveau
  form.noteComportement = c.noteComportement
  form.noteMotivation = c.noteMotivation
  form.remarque = c.remarque
})

function clampNote(field: 'noteNiveau' | 'noteComportement' | 'noteMotivation') {
  const v = form[field]
  if (v === null || v === undefined) return
  form[field] = Math.min(20, Math.max(0, v)) as number
}
function save() { emit('updateEvaluation', { ...form }) }

function scoreColor(v: string | number) {
  const n = parseFloat(String(v))
  if (isNaN(n)) return 'bg-slate-600'
  if (n >= 14) return 'bg-emerald-500'
  if (n >= 10) return 'bg-amber-500'
  return 'bg-rose-500'
}
function scorePct(v: string | number) {
  const n = parseFloat(String(v))
  return isNaN(n) ? 0 : (n / 20) * 100
}

interface ColGroup {
  label: string
  cols: number[]
  accent: string
  heading: string
  bg: string
  border: string
}

const colGroups = computed<ColGroup[]>(() => {
  const excluded = new Set([props.displayCols.nom, props.displayCols.prenom])
  const general: number[] = [], y2526: number[] = [], y2425: number[] = []
  props.headers.slice(0, 26).forEach((h, i) => {
    if (excluded.has(i)) return
    const s = String(h ?? '').trim()
    if (!s) return
    if (s.includes('2025/2026')) { if (!s.toLowerCase().includes('année scolaire')) y2526.push(i) }
    else if (s.includes('2024/2025')) { if (!s.toLowerCase().includes('année scolaire')) y2425.push(i) }
    else general.push(i)
  })
  const groups: ColGroup[] = []
  if (general.length) groups.push({ label: 'Général', cols: general, accent: 'text-slate-400', heading: 'text-slate-400', bg: 'bg-slate-800/60', border: 'border-slate-700/60' })
  if (y2526.length) groups.push({ label: '2025 / 2026', cols: y2526, accent: 'text-indigo-400', heading: 'text-indigo-400', bg: 'bg-indigo-950/40', border: 'border-indigo-800/40' })
  if (y2425.length) groups.push({ label: '2024 / 2025', cols: y2425, accent: 'text-emerald-400', heading: 'text-emerald-400', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40' })
  return groups
})

const serieCols = computed(() =>
  (colGroups.value[0]?.cols ?? []).filter(i =>
    String(props.headers[i] ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('serie')
  )
)
const generalOtherCols = computed(() =>
  (colGroups.value[0]?.cols ?? []).filter(i => !serieCols.value.includes(i))
)

function colLabel(i: number): string {
  return String(props.headers[i] ?? `Col ${i}`)
    .replace(/\s*[-–]\s*(Libellé|Code)\s+\d{4}\/\d{4}$/i, '')
    .replace(/\s+\d{4}\/\d{4}$/i, '')
    .trim() || `Col ${i}`
}
function colValue(i: number): string { return String(props.candidat.raw[i] ?? '—') }

const candidatName = computed(() =>
  [props.candidat.raw[props.displayCols.nom], props.candidat.raw[props.displayCols.prenom]]
    .filter(Boolean).join(' ') || `Candidat #${props.candidat.index + 1}`
)
const serieLabel = computed(() => String(props.candidat.raw[props.displayCols.serie] || ''))

const hasAnyScore = computed(() =>
  form.noteNiveau !== '' || form.noteComportement !== '' || form.noteMotivation !== ''
)
const avgScore = computed(() => {
  const vals = [form.noteNiveau, form.noteComportement, form.noteMotivation]
    .map(v => parseFloat(String(v))).filter(v => !isNaN(v))
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden bg-slate-900">

    <!-- ── Header ── -->
    <div class="flex-shrink-0 px-5 py-3 bg-slate-900 border-b border-slate-700/80 flex items-center gap-4">
      <div class="min-w-0 flex-1">
        <h2 class="text-lg font-bold text-white leading-tight truncate tracking-tight">{{ candidatName }}</h2>
        <div class="flex items-center gap-2 mt-0.5">
          <span v-if="serieLabel" class="inline-block text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {{ serieLabel }}
          </span>
          <span class="text-slate-600 text-xs font-mono">· {{ candidat.raw[3] }}</span>
        </div>
      </div>
      <!-- Moyenne -->
      <div v-if="hasAnyScore" class="flex-shrink-0 text-right">
        <div class="text-2xl font-bold tabular-nums leading-none"
          :class="parseFloat(String(avgScore)) >= 14 ? 'text-emerald-400' : parseFloat(String(avgScore)) >= 10 ? 'text-amber-400' : 'text-rose-400'">
          {{ avgScore }}
        </div>
        <div class="text-xs text-slate-600 mt-0.5">/ 20 moy.</div>
      </div>
    </div>

    <!-- ── Body ── -->
    <div class="flex-1 min-h-0 flex overflow-hidden">

      <!-- ── Left: info blocks ── -->
      <div class="flex-1 min-w-0 flex flex-col overflow-hidden p-3 gap-3">

        <!-- Scolarités côte à côte -->
        <div class="flex gap-3 flex-shrink-0" v-if="colGroups.length > 1">
          <section
            v-for="group in colGroups.slice(1)"
            :key="group.label"
            class="flex-1 rounded-xl border p-3"
            :class="[group.bg, group.border]"
          >
            <h3 class="text-xs font-bold uppercase tracking-widest mb-2.5" :class="group.heading">
              Scolarité {{ group.label }}
            </h3>
            <dl class="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <div v-for="i in group.cols" :key="i">
                <dt class="text-xs text-slate-500 leading-tight mb-0.5">{{ colLabel(i) }}</dt>
                <dd class="text-sm text-slate-200 font-medium break-words leading-tight">{{ colValue(i) }}</dd>
              </div>
            </dl>
          </section>
        </div>

        <!-- Général -->
        <section class="flex-1 min-h-0 overflow-y-auto rounded-xl border bg-slate-800/60 border-slate-700/60 p-3">
          <h3 class="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5">Informations générales</h3>

          <!-- Série en avant -->
          <div v-if="serieCols.length" class="mb-3 rounded-lg bg-slate-700/50 border border-slate-600/40 px-3 py-2.5 flex gap-6">
            <div v-for="i in serieCols" :key="i">
              <dt class="text-xs text-slate-400 mb-0.5">{{ colLabel(i) }}</dt>
              <dd class="text-base text-white font-bold tracking-tight">{{ colValue(i) }}</dd>
            </div>
          </div>

          <dl class="grid grid-cols-3 gap-x-4 gap-y-3">
            <div v-for="i in generalOtherCols" :key="i">
              <dt class="text-xs text-slate-500 leading-tight mb-0.5">{{ colLabel(i) }}</dt>
              <dd class="text-sm text-slate-200 font-medium break-words leading-tight" :title="colValue(i)">{{ colValue(i) }}</dd>
            </div>
          </dl>
        </section>
      </div>

      <!-- ── Right sidebar: éval + PDF ── -->
      <div class="w-80 flex-shrink-0 flex flex-col border-l border-slate-700/80 overflow-hidden">

        <!-- Évaluation -->
        <section class="flex-shrink-0 p-4 border-b border-indigo-700/50 bg-indigo-950/30">
          <h3 class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
            Évaluation
          </h3>

          <div class="space-y-3">
            <!-- Niveau -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm text-slate-400">Niveau</label>
                <input
                  v-model="form.noteNiveau" type="number" min="0" max="20" step="0.5" placeholder="—"
                  class="w-16 bg-slate-700/80 border border-slate-600 rounded-md px-2 py-1 text-white text-sm text-center tabular-nums placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  @change="clampNote('noteNiveau'); save()"
                />
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300" :class="scoreColor(form.noteNiveau)" :style="{ width: scorePct(form.noteNiveau) + '%' }" />
              </div>
            </div>

            <!-- Comportement -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm text-slate-400">Comportement</label>
                <input
                  v-model="form.noteComportement" type="number" min="0" max="20" step="0.5" placeholder="—"
                  class="w-16 bg-slate-700/80 border border-slate-600 rounded-md px-2 py-1 text-white text-sm text-center tabular-nums placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  @change="clampNote('noteComportement'); save()"
                />
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300" :class="scoreColor(form.noteComportement)" :style="{ width: scorePct(form.noteComportement) + '%' }" />
              </div>
            </div>

            <!-- Motivation -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-sm text-slate-400">Motivation</label>
                <input
                  v-model="form.noteMotivation" type="number" min="0" max="20" step="0.5" placeholder="—"
                  class="w-16 bg-slate-700/80 border border-slate-600 rounded-md px-2 py-1 text-white text-sm text-center tabular-nums placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  @change="clampNote('noteMotivation'); save()"
                />
              </div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-300" :class="scoreColor(form.noteMotivation)" :style="{ width: scorePct(form.noteMotivation) + '%' }" />
              </div>
            </div>
          </div>

          <textarea
            v-model="form.remarque" rows="3" placeholder="Remarque..."
            class="mt-3 w-full bg-slate-700/80 border border-slate-600 rounded-lg px-2.5 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            @change="save"
          />
        </section>

        <!-- PDF -->
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
          <!-- Trouvé -->
          <PdfViewer
            v-if="pdfDoc && pdfRange"
            :pdf-doc="pdfDoc"
            :start-page="pdfRange.start"
            :end-page="pdfRange.end"
          />

          <!-- Recherche -->
          <div v-else-if="pdfDoc && isPdfSearching" class="flex-1 flex flex-col items-center justify-center gap-2 text-slate-600">
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span class="text-xs">Recherche...</span>
          </div>

          <!-- Introuvable -->
          <div v-else-if="pdfDoc && !pdfRange" class="flex-1 flex flex-col items-center justify-center gap-2 text-slate-700 p-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-xs text-center">Dossier introuvable</p>
            <p class="text-[10px] text-slate-700 font-mono">{{ candidat.raw[3] }}</p>
          </div>

          <!-- Pas de PDF -->
          <div v-else class="flex-1 flex items-center justify-center text-slate-700 text-xs">
            Aucun PDF
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
