import avatar1 from '@/assets/avatar-presets/avatar-1.png'
import avatar2 from '@/assets/avatar-presets/avatar-2.png'
import avatar3 from '@/assets/avatar-presets/avatar-3.png'
import avatar4 from '@/assets/avatar-presets/avatar-4.png'
import avatar5 from '@/assets/avatar-presets/avatar-5.png'
import avatar6 from '@/assets/avatar-presets/avatar-6.png'
import avatar7 from '@/assets/avatar-presets/avatar-7.png'
import avatar8 from '@/assets/avatar-presets/avatar-8.png'
import avatar9 from '@/assets/avatar-presets/avatar-9.png'

/** 换头像页 3×3 与 `avatar-*` id 一一对应 */
export const AVATAR_CELL_PX = 90

export const AVATAR_CELLS = [
  { id: 'avatar-1', src: avatar1 },
  { id: 'avatar-2', src: avatar2 },
  { id: 'avatar-3', src: avatar3 },
  { id: 'avatar-4', src: avatar4 },
  { id: 'avatar-5', src: avatar5 },
  { id: 'avatar-6', src: avatar6 },
  { id: 'avatar-7', src: avatar7 },
  { id: 'avatar-8', src: avatar8 },
  { id: 'avatar-9', src: avatar9 },
] as const

/** 目录页、聊天气泡等：按预设 id 缩放到指定边长 */
export function avatarPresetPreviewStyle(presetId: string | null, sizePx: number) {
  if (!presetId) return null
  const cell = AVATAR_CELLS.find((c) => c.id === presetId)
  if (!cell) return null
  return {
    backgroundImage: `url(${cell.src})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    width: `${sizePx}px`,
    height: `${sizePx}px`,
  }
}
