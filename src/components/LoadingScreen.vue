<template>
  <div class="flex flex-col items-center justify-center h-full gap-6">
    <span class="text-indigo-400 text-2xl font-bold tracking-tight">ParcoursScore</span>

    <div class="w-72 text-center">
      <p class="text-slate-300 text-sm font-medium mb-1">Chargement du PDF...</p>
      <p class="text-slate-500 text-xs mb-4">Veuillez patienter</p>
      <svg class="w-8 h-8 animate-spin text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
    </div>
  </div>
</template>
