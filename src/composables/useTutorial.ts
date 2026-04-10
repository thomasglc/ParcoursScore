import { ref } from 'vue'

const STORAGE_KEY = 'parcoursscore-tutorial-done'

const visible = ref(localStorage.getItem(STORAGE_KEY) !== '1')
const step = ref(0)

export function useTutorial() {
  function open()  { step.value = 0; visible.value = true }
  function close() { visible.value = false; localStorage.setItem(STORAGE_KEY, '1') }
  function next()  { step.value < 3 ? step.value++ : close() }
  function prev()  { if (step.value > 0) step.value-- }
  return { visible, step, open, close, next, prev }
}
