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

function evalCount(c: CandidatRow): number {
  return [c.noteNiveau, c.noteComportement, c.noteMotivation].filter(v => v !== '').length
}

function avgScore(c: CandidatRow): string | null {
  const vals = [c.noteNiveau, c.noteComportement, c.noteMotivation]
    .map(v => parseFloat(String(v))).filter(v => !isNaN(v))
  if (!vals.length) return null
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function scoreColor(c: CandidatRow): string {
  const avg = avgScore(c)
  if (!avg) return 'text-slate-600'
  const n = parseFloat(avg)
  if (n >= 14) return 'text-emerald-400'
  if (n >= 10) return 'text-amber-400'
  return 'text-rose-400'
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-4 py-2.5 border-b border-slate-700/60 flex-shrink-0">
      <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        {{ candidats.length }} candidat{{ candidats.length > 1 ? 's' : '' }}
        <span class="text-slate-400 font-normal ml-1">
          · {{ candidats.filter(c => evalCount(c) > 0).length }} évalués
          <span class="text-slate-400">({{ candidats.length ? Math.round(candidats.filter(c => evalCount(c) > 0).length / candidats.length * 100) : 0 }}%)</span>
        </span>
      </p>
    </div>

    <div class="flex-1 overflow-y-auto">
      <button
        v-for="c in candidats"
        :key="c.index"
        class="w-full text-left px-3 py-2.5 border-b border-slate-700/30 transition-colors duration-75 flex items-center gap-2.5"
        :class="c.index === selectedIndex
          ? 'bg-indigo-600/90 text-white'
          : 'text-slate-300 hover:bg-slate-700/50'"
        @click="emit('select', c.index)"
      >
        <!-- Index number -->
        <span
          class="text-[10px] tabular-nums w-6 flex-shrink-0 text-right font-mono"
          :class="c.index === selectedIndex ? 'text-indigo-200' : 'text-slate-600'"
        >{{ c.index + 1 }}</span>

        <!-- Name + series -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold truncate leading-tight">
            {{ c.raw[displayCols.nom] || '—' }}
            <span class="font-normal opacity-80">{{ c.raw[displayCols.prenom] || '' }}</span>
          </div>
          <div class="text-xs mt-0.5 truncate" :class="c.index === selectedIndex ? 'text-indigo-200' : 'text-slate-500'">
            {{ c.raw[displayCols.serie] || 'Série inconnue' }}
          </div>
        </div>

        <!-- Score -->
        <div v-if="avgScore(c)" class="flex-shrink-0 text-right">
          <span class="text-sm font-bold tabular-nums" :class="c.index === selectedIndex ? 'text-white' : scoreColor(c)">
            {{ avgScore(c) }}
          </span>
          <span class="text-xs opacity-50 ml-0.5">/20</span>
        </div>
        <!-- Pas encore évalué mais ouvert -->
        <div v-else-if="evalCount(c) === 0" class="w-1 h-1 rounded-full flex-shrink-0 bg-slate-700" />
      </button>
    </div>
  </div>
</template>
