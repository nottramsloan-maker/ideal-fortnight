const {
  DEFAULT_URL,
  URL_AVATAR,
  URL_CARRIER,
  getSavedUrl,
  saveUrl,
} = require('../../utils/h5Preview.js')

Page({
  data: {
    h5Input: '',
  },

  onLoad() {
    const saved = getSavedUrl()
    this.setData({ h5Input: saved || DEFAULT_URL })
  },

  onH5Input(e) {
    this.setData({ h5Input: e.detail.value })
  },

  fillAvatarUrl() {
    this.setData({ h5Input: URL_AVATAR })
  },

  fillCarrierUrl() {
    this.setData({ h5Input: URL_CARRIER })
  },

  openH5Preview() {
    const url = (this.data.h5Input || '').trim() || DEFAULT_URL
    saveUrl(url)
    wx.navigateTo({
      url: '/pages/h5/h5?src=' + encodeURIComponent(url),
    })
  },

  showTroubleshoot() {
    wx.showModal({
      title: '白屏 / 打不开时',
      content:
        '1）终端执行 cd apps/web && npm run dev，确认已启动。\n\n' +
        '2）详情→本地设置→勾选「不校验合法域名、web-view…」。\n\n' +
        '3）把 127.0.0.1 换成终端里 Network 后的 IP（或本机局域网 IP）。\n\n' +
        '4）个人主体小程序可能禁止使用 web-view，会一直白屏，需企业主体或用手机浏览器打开同一网址测试。',
      showCancel: false,
    })
  },
})
