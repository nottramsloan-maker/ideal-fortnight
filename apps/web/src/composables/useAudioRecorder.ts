/** 语音故事 — 接能力后实现 */
export function useAudioRecorder() {
  return {
    start: async () => {},
    stop: async () => ({ blob: null as Blob | null }),
  }
}
