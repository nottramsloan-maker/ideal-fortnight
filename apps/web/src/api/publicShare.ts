import { apiGet } from './client'

/** GET /p/:slug — 仅 PublicLandingDTO（技术方案 §7） */
export function fetchPublicLanding(slug: string) {
  return apiGet<unknown>(`/p/${encodeURIComponent(slug)}`)
}
