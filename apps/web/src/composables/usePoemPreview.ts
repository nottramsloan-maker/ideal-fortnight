import { ref } from 'vue'

/** 按住预览他人诗句 — 与 PoemSwitch 配合 */
export function usePoemPreview() {
  const showingOthers = ref(false)
  function onPointerDown() {
    showingOthers.value = true
  }
  function onPointerUp() {
    showingOthers.value = false
  }
  return { showingOthers, onPointerDown, onPointerUp }
}
