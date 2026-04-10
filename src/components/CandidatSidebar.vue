<script setup lang="ts">
import type { CandidatRow, DisplayCols } from '@/composables/useCandidats'

const props = defineProps<{
  candidats: CandidatRow[]
  selectedIndex: number
  displayCols: DisplayCols
}>()

const emit = defineEmits<{
  select: [index: number]
}>()

function hasEvaluation(c: CandidatRow): boolean {
  return c.noteNiveau !== '' || c.noteComportement !== '' || c.noteMotivation !== ''
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-4 py-3 border-b border-slate-700/80 flex-shrink-0">
      <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        {{ candidats.length }} candidat{{ candidats.length > 1 ? 's' : '' }}
      </p>
    </div>

    <div class="flex-1 overflow-y-auto">
      <button
        v-for="c in candidats"
        :key="c.index"
        class="w-full text-left px-4 py-3 border-b border-slate-700/40 transition-colors duration-100 flex items-center gap-2"
        :class="c.index === selectedIndex
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-700/60'"
        @click="emit('select', c.index)"
      >
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium truncate leading-tight">
            {{ c.raw[displayCols.nom] || '—' }}
            {{ c.raw[displayCols.prenom] || '' }}
          </div>
          <div
            class="text-xs mt-0.5 truncate"
            :class="c.index === selectedIndex ? 'text-indigo-200' : 'text-slate-500'"
          >
            {{ c.raw[displayCols.serie] || 'Série inconnue' }}
          </div>
        </div>
        <div
          v-if="hasEvaluation(c)"
          class="w-1.5 h-1.5 rounded-full flex-shrink-0"
          :class="c.index === selectedIndex ? 'bg-indigo-200' : 'bg-indigo-400'"
          title="Évalué"
        />
      </button>
    </div>
  </div>
</template>
