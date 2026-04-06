const { DEFAULT_URL, getSavedUrl } = require('../../utils/h5Preview.js')

Page({
  data: {
    h5Url: '',
  },

  onLoad(query) {
    let src = getSavedUrl() || DEFAULT_URL
    if (query.src) {
      try {
        src = decodeURIComponent(query.src)
      } catch {
        src = query.src
      }
    }
    this.setData({ h5Url: src })
  },

  onWebViewError(e) {
    const detail = e.detail || {}
    const msg = detail.errMsg || detail.fullUrl || JSON.stringify(detail)
    wx.showModal({
      title: 'H5 加载失败',
      content: `${msg}\n\n请检查：\n1）终端已运行：cd apps/web && npm run dev:mini（微信内预览）或 npm run dev\n2）详情→本地设置→勾选「不校验合法域名、web-view…」\n3）127.0.0.1 换成本机 Network IP 或局域网 IP\n4）个人主体小程序可能禁止 web-view，会一直白屏`,
      showCancel: false,
    })
  },
})
