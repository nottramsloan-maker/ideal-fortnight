/** 预签名上传 — 接 API 后实现 */
export function useUpload() {
  async function upload(_file: File): Promise<string> {
    throw new Error('useUpload: 待对接预签名接口')
  }
  return { upload }
}
