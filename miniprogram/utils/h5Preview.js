const STORAGE_KEY = 'h5PreviewUrl'

/** 模拟器同机可试；白屏时改为终端 `npm run dev` 里 Network 行的 IP */
const DEFAULT_URL = 'http://127.0.0.1:5173/onboarding/avatar'

const URL_AVATAR = 'http://127.0.0.1:5173/onboarding/avatar'
const URL_CARRIER = 'http://127.0.0.1:5173/onboarding/carrier'

function getSavedUrl() {
  try {
    const v = wx.getStorageSync(STORAGE_KEY)
    return typeof v === 'string' && v.trim() ? v.trim() : ''
  } catch {
    return ''
  }
}

function saveUrl(url) {
  wx.setStorageSync(STORAGE_KEY, url.trim())
}

module.exports = {
  STORAGE_KEY,
  DEFAULT_URL,
  URL_AVATAR,
  URL_CARRIER,
  getSavedUrl,
  saveUrl,
}
