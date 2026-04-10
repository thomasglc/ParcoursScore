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

// — Evaluation form —
const form = reactive<EvaluationData>({
  noteNiveau: props.candidat.noteNiveau,
  noteComportement: props.candidat.noteComportement,
  noteMotivation: props.candidat.noteMotivation,
  remarque: props.candidat.remarque,
})

watch(
  () => props.candidat,
  (c) => {
    form.noteNiveau = c.noteNiveau
    form.noteComportement = c.noteComportement
    form.noteMotivation = c.noteMotivation
    form.remarque = c.remarque
  }
)

function clampNote(field: 'noteNiveau' | 'noteComportement' | 'noteMotivation') {
  const v = form[field]
  if (v === null || v === undefined) return
  form[field] = Math.min(20, Math.max(0, v)) as number
}

function save() { emit('updateEvaluation', { ...form }) }

// — Column groups —
interface ColGroup {
  label: string
  cols: number[]
  classes: { section: string; heading: string }
}

const colGroups = computed<ColGroup[]>(() => {
  const general: number[] = [], y2526: number[] = [], y2425: number[] = []
  props.headers.slice(0, 26).forEach((h, i) => {
    const s = String(h ?? '').trim()
    if (!s) return
    if (s.includes('2025/2026')) { if (!s.toLowerCase().includes('année scolaire')) y2526.push(i) }
    else if (s.includes('2024/2025')) { if (!s.toLowerCase().includes('année scolaire')) y2425.push(i) }
    else general.push(i)
  })
  const groups: ColGroup[] = []
  if (general.length) groups.push({ label: 'Informations générales', cols: general, classes: { section: 'bg-slate-800 border border-slate-700', heading: 'text-slate-400' } })
  if (y2526.length) groups.push({ label: 'Scolarité 2025/2026', cols: y2526, classes: { section: 'bg-indigo-950/50 border border-indigo-800/40', heading: 'text-indigo-400' } })
  if (y2425.length) groups.push({ label: 'Scolarité 2024/2025', cols: y2425, classes: { section: 'bg-emerald-950/50 border border-emerald-800/40', heading: 'text-emerald-400' } })
  return groups
})

function colLabel(i: number): string {
  return String(props.headers[i] ?? `Colonne ${i}`)
    .replace(/\s*[-–]\s*(Libellé|Code)\s+\d{4}\/\d{4}$/i, '')
    .replace(/\s+\d{4}\/\d{4}$/i, '')
    .trim() || `Colonne ${i}`
}

function colValue(i: number): string { return String(props.candidat.raw[i] ?? '—') }

const candidatName = computed(() =>
  [props.candidat.raw[props.displayCols.nom], props.candidat.raw[props.displayCols.prenom]]
    .filter(Boolean).join(' ') || `Candidat #${props.candidat.index + 1}`
)

</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="px-5 py-3 border-b border-slate-700 flex-shrink-0 bg-slate-900 flex items-center gap-3">
      <div class="min-w-0 flex-1">
        <h2 class="text-base font-bold text-white truncate">{{ candidatName }}</h2>
        <p class="text-slate-500 text-xs">
          Candidat {{ candidat.index + 1 }} &bull; {{ candidat.raw[displayCols.serie] || 'Série inconnue' }}
        </p>
      </div>
    </div>

    <!-- Content: left info+eval | right PDF -->
    <div class="flex-1 min-h-0 flex overflow-hidden">

      <!-- Left panel -->
      <div class="flex-1 min-w-0 flex flex-col overflow-hidden border-r border-slate-700">
        <!-- Info blocks -->
        <div class="flex gap-2 min-h-0 flex-1 p-2 pb-0">
          <!-- Générales (large) -->
          <section
            class="flex-1 rounded-xl p-3 min-w-0 overflow-y-auto"
            :class="colGroups[0]?.classes.section"
          >
            <h3 class="text-xs font-semibold uppercase tracking-widest mb-2" :class="colGroups[0]?.classes.heading">
              {{ colGroups[0]?.label }}
            </h3>
            <dl class="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <div v-for="i in colGroups[0]?.cols" :key="i" class="min-w-0">
                <dt class="text-xs text-slate-500 truncate leading-tight">{{ colLabel(i) }}</dt>
                <dd class="text-sm text-slate-200 truncate font-medium" :title="colValue(i)">{{ colValue(i) }}</dd>
              </div>
            </dl>
          </section>

          <!-- Scolarités empilées -->
          <div class="w-56 flex flex-col gap-2 min-h-0">
            <section
              v-for="group in colGroups.slice(1)"
              :key="group.label"
              class="flex-1 rounded-xl p-3 overflow-y-auto"
              :class="group.classes.section"
            >
              <h3 class="text-xs font-semibold uppercase tracking-widest mb-2" :class="group.classes.heading">
                {{ group.label }}
              </h3>
              <dl class="space-y-1.5">
                <div v-for="i in group.cols" :key="i" class="min-w-0">
                  <dt class="text-xs text-slate-500 truncate leading-tight">{{ colLabel(i) }}</dt>
                  <dd class="text-sm text-slate-200 truncate font-medium" :title="colValue(i)">{{ colValue(i) }}</dd>
                </div>
              </dl>
            </section>
          </div>
        </div>

        <!-- Evaluation -->
        <section class="flex-shrink-0 m-2 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Évaluation</h3>
          <div class="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Niveau</label>
              <input v-model="form.noteNiveau" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="clampNote('noteNiveau'); save()" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Comportement</label>
              <input v-model="form.noteComportement" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="clampNote('noteComportement'); save()" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Motivation</label>
              <input v-model="form.noteMotivation" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="clampNote('noteMotivation'); save()" />
            </div>
          </div>
          <textarea v-model="form.remarque" rows="2" placeholder="Remarque..."
            class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
            @change="save" />
        </section>
      </div>

      <!-- Right panel: PDF -->
      <div class="w-[420px] flex-shrink-0 flex flex-col">
        <!-- PDF viewer quand le dossier est trouvé -->
        <PdfViewer
          v-if="pdfDoc && pdfRange"
          :pdf-doc="pdfDoc"
          :start-page="pdfRange.start"
          :end-page="pdfRange.end"
        />

        <!-- Recherche en cours dans le PDF -->
        <div
          v-else-if="pdfDoc && isPdfSearching"
          class="flex-1 flex flex-col items-center justify-center gap-3 text-slate-500"
        >
          <svg class="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          <p class="text-sm">Recherche du dossier...</p>
        </div>

        <!-- Dossier introuvable dans l'index (code non correspondant) -->
        <div
          v-else-if="pdfDoc && !pdfRange"
          class="flex-1 flex flex-col items-center justify-center gap-2 text-slate-600 p-6"
        >
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p class="text-sm text-center">Dossier PDF introuvable<br/>pour ce candidat</p>
          <p class="text-xs text-center text-slate-700">Code : {{ candidat.raw[3] }}</p>
        </div>

        <!-- Ne devrait pas arriver (PDF toujours chargé avant le dashboard) -->
        <div v-else class="flex-1 flex items-center justify-center text-slate-700 text-sm">
          Aucun PDF chargé
        </div>
      </div>
    </div>
  </div>
</template>
