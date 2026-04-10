<script setup lang="ts">
import { useTutorial } from '@/composables/useTutorial'

import { computed } from 'vue'
const { visible, step, close, next, prev } = useTutorial()
const current = computed(() => steps[step.value]!)

const steps = [
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>`,
    title: 'Chargement des fichiers',
    desc: 'Déposez votre fichier <strong>XLSX Parcoursup</strong> et le <strong>PDF des dossiers candidats</strong> sur l\'écran d\'accueil — glissez les deux en même temps ou cliquez sur chaque zone.',
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6h16M4 10h16M4 14h16M4 18h16"/>`,
    title: 'Navigation entre candidats',
    desc: 'Utilisez la <strong>sidebar gauche</strong> pour sélectionner un candidat. Les touches <kbd>↑</kbd> <kbd>↓</kbd> permettent de naviguer rapidement. Les candidats déjà évalués affichent leur moyenne.',
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>`,
    title: 'Évaluation du candidat',
    desc: 'Renseignez les notes de <strong>Niveau technique</strong>, <strong>Savoir-être</strong> et <strong>Motivation</strong> (0–20). Ajoutez une remarque si besoin. La sauvegarde est <strong>automatique</strong> — vos notes sont conservées même si vous fermez l\'onglet.',
  },
  {
    icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>`,
    title: 'Export des résultats',
    desc: 'Une fois toutes vos évaluations saisies, cliquez sur <strong>Exporter</strong> en haut de la sidebar. Vous récupérez le fichier XLSX original enrichi avec les notes et remarques.',
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        @click.self="close"
      >
        <div class="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="px-6 pt-6 pb-4 border-b border-slate-700/60 flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-1">Guide d'utilisation</p>
              <h2 class="text-lg font-bold text-white">{{ current.title }}</h2>
            </div>
            <button class="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors mt-0.5" @click="close">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-6 py-6 flex gap-5 items-start">
            <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
              <svg class="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" v-html="current.icon" />
            </div>
            <p class="text-slate-300 text-sm leading-relaxed" v-html="current.desc" />
          </div>

          <!-- Footer -->
          <div class="px-6 pb-6 flex items-center justify-between gap-4">
            <!-- Dots -->
            <div class="flex gap-1.5">
              <button
                v-for="i in 4" :key="i"
                class="w-2 h-2 rounded-full transition-all duration-200"
                :class="i - 1 === step ? 'bg-indigo-400 w-5' : 'bg-slate-600 hover:bg-slate-500'"
                @click="() => { if (i - 1 <= step || i - 1 === step + 1) step = i - 1 }"
              />
            </div>

            <div class="flex gap-2">
              <button
                v-if="step > 0"
                class="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                @click="prev"
              >Précédent</button>
              <button
                class="px-5 py-2 text-sm font-semibold rounded-xl transition-colors"
                :class="step === 3 ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'"
                @click="next"
              >{{ step === 3 ? 'Commencer' : 'Suivant' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
