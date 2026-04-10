<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import type { CandidatRow, RawRow, DisplayCols, EvaluationData } from '@/composables/useCandidats'

const props = defineProps<{
  candidat: CandidatRow
  headers: RawRow
  displayCols: DisplayCols
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

watch(
  () => props.candidat,
  (c) => {
    form.noteNiveau = c.noteNiveau
    form.noteComportement = c.noteComportement
    form.noteMotivation = c.noteMotivation
    form.remarque = c.remarque
  }
)

function save() {
  emit('updateEvaluation', { ...form })
}

interface ColGroup {
  label: string
  cols: number[]
  classes: { section: string; heading: string }
}

const colGroups = computed<ColGroup[]>(() => {
  const general: number[] = []
  const y2526: number[] = []
  const y2425: number[] = []

  props.headers.slice(0, 26).forEach((h, i) => {
    const s = String(h ?? '').trim()
    if (!s) return
    if (s.includes('2025/2026')) { if (!s.toLowerCase().includes('année scolaire')) y2526.push(i) }
    else if (s.includes('2024/2025')) { if (!s.toLowerCase().includes('année scolaire')) y2425.push(i) }
    else general.push(i)
  })

  const groups: ColGroup[] = []
  if (general.length)
    groups.push({
      label: 'Informations générales',
      cols: general,
      classes: { section: 'bg-slate-800 border border-slate-700', heading: 'text-slate-400' },
    })
  if (y2526.length)
    groups.push({
      label: 'Scolarité 2025/2026',
      cols: y2526,
      classes: { section: 'bg-indigo-950/50 border border-indigo-800/40', heading: 'text-indigo-400' },
    })
  if (y2425.length)
    groups.push({
      label: 'Scolarité 2024/2025',
      cols: y2425,
      classes: { section: 'bg-emerald-950/50 border border-emerald-800/40', heading: 'text-emerald-400' },
    })
  return groups
})

function colLabel(i: number): string {
  // Strip year suffix like " - Libellé 2025/2026" for cleaner display inside a year block
  return String(props.headers[i] ?? `Colonne ${i}`)
    .replace(/\s*[-–]\s*(Libellé|Code)\s+\d{4}\/\d{4}$/i, '')
    .replace(/\s+\d{4}\/\d{4}$/i, '')
    .trim() || `Colonne ${i}`
}

function colValue(i: number): string {
  return String(props.candidat.raw[i] ?? '—')
}

const candidatName = computed(() =>
  [props.candidat.raw[props.displayCols.nom], props.candidat.raw[props.displayCols.prenom]]
    .filter(Boolean)
    .join(' ') || `Candidat #${props.candidat.index + 1}`
)
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Candidate header -->
    <div class="px-6 py-4 border-b border-slate-700 flex-shrink-0 bg-slate-900">
      <h2 class="text-lg font-bold text-white truncate">{{ candidatName }}</h2>
      <p class="text-slate-500 text-xs mt-0.5">
        Candidat {{ candidat.index + 1 }}
        &bull;
        {{ candidat.raw[displayCols.serie] || 'Série inconnue' }}
      </p>
    </div>

    <div class="flex-1 min-h-0 p-3 flex flex-col gap-3">
      <!-- Info blocks -->
      <div class="flex gap-3 min-h-0 flex-1">
        <!-- Informations générales : large -->
        <section
          class="flex-1 rounded-xl p-3 min-w-0 overflow-y-auto"
          :class="colGroups[0]?.classes.section"
        >
          <h3 class="text-xs font-semibold uppercase tracking-widest mb-2" :class="colGroups[0]?.classes.heading">
            {{ colGroups[0]?.label }}
          </h3>
          <dl class="grid grid-cols-2 gap-x-4 gap-y-2">
            <div v-for="i in colGroups[0]?.cols" :key="i" class="min-w-0">
              <dt class="text-xs text-slate-500 truncate leading-tight">{{ colLabel(i) }}</dt>
              <dd class="text-sm text-slate-200 truncate font-medium" :title="colValue(i)">{{ colValue(i) }}</dd>
            </div>
          </dl>
        </section>

        <!-- Scolarités empilées -->
        <div class="w-64 flex flex-col gap-3 min-h-0">
          <section
            v-for="group in colGroups.slice(1)"
            :key="group.label"
            class="flex-1 rounded-xl p-3 overflow-y-auto"
            :class="group.classes.section"
          >
            <h3 class="text-xs font-semibold uppercase tracking-widest mb-2" :class="group.classes.heading">
              {{ group.label }}
            </h3>
            <dl class="space-y-2">
              <div v-for="i in group.cols" :key="i" class="min-w-0">
                <dt class="text-xs text-slate-500 truncate leading-tight">{{ colLabel(i) }}</dt>
                <dd class="text-sm text-slate-200 truncate font-medium" :title="colValue(i)">{{ colValue(i) }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      <!-- Evaluation + PDF side by side -->
      <div class="flex gap-3 flex-shrink-0">
        <section class="flex-1 bg-slate-800 border border-slate-700 rounded-xl p-3">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Évaluation</h3>
          <div class="grid grid-cols-3 gap-2 mb-2">
            <div>
              <label class="block text-xs text-slate-500 mb-1">Note de niveau</label>
              <input v-model="form.noteNiveau" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="save" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Note de comportement</label>
              <input v-model="form.noteComportement" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="save" />
            </div>
            <div>
              <label class="block text-xs text-slate-500 mb-1">Note de motivation</label>
              <input v-model="form.noteMotivation" type="number" min="0" max="20" step="0.5" placeholder="—"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                @change="save" />
            </div>
          </div>
          <div>
            <label class="block text-xs text-slate-500 mb-1">Remarque</label>
            <textarea v-model="form.remarque" rows="2" placeholder="Ajouter une remarque..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
              @change="save" />
          </div>
        </section>

        <section class="w-48 bg-slate-800 border border-slate-700 rounded-xl p-3 flex flex-col">
          <h3 class="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Document PDF</h3>
          <div class="flex-1 border-2 border-dashed border-slate-600/60 rounded-lg flex flex-col items-center justify-center gap-1">
            <svg class="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p class="text-slate-600 text-xs">À venir</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
