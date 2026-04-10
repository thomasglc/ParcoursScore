import { ref } from 'vue'

const isDark = ref(localStorage.getItem('parcoursscore-theme') !== 'light')

function apply(dark: boolean) {
  document.documentElement.classList.toggle('light', !dark)
  localStorage.setItem('parcoursscore-theme', dark ? 'dark' : 'light')
}

apply(isDark.value)

export function useTheme() {
  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
  }
  return { isDark, toggle }
}
