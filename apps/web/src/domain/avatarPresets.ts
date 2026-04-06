import refImg from '@/assets/figma/onboarding-avatar/reference.png'

export const AVATAR_FRAME_W = 390
export const AVATAR_FRAME_H = 844
export const AVATAR_CELL_PX = 90

export const AVATAR_CELLS = [
  { id: 'avatar-1', x: 29, y: 245 },
  { id: 'avatar-2', x: 149, y: 245 },
  { id: 'avatar-3', x: 271, y: 245 },
  { id: 'avatar-4', x: 29, y: 371 },
  { id: 'avatar-5', x: 149, y: 371 },
  { id: 'avatar-6', x: 271, y: 371 },
  { id: 'avatar-7', x: 29, y: 497 },
  { id: 'avatar-8', x: 149, y: 497 },
  { id: 'avatar-9', x: 271, y: 497 },
] as const

export function avatarCellPickStyle(x: number, y: number) {
  return {
    backgroundImage: `url(${refImg})`,
    backgroundSize: `${AVATAR_FRAME_W}px ${AVATAR_FRAME_H}px`,
    backgroundPosition: `-${x}px -${y}px`,
  }
}

/** 目录页等放大展示：按单元格等比缩放 */
export function avatarPresetPreviewStyle(presetId: string | null, sizePx: number) {
  if (!presetId) return null
  const cell = AVATAR_CELLS.find((c) => c.id === presetId)
  if (!cell) return null
  const s = sizePx / AVATAR_CELL_PX
  return {
    backgroundImage: `url(${refImg})`,
    backgroundSize: `${AVATAR_FRAME_W * s}px ${AVATAR_FRAME_H * s}px`,
    backgroundPosition: `-${cell.x * s}px -${cell.y * s}px`,
    width: `${sizePx}px`,
    height: `${sizePx}px`,
  }
}
