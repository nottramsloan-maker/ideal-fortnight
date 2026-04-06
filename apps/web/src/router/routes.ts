import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由与 PRD/技术方案 §9 对齐。
 * 外链落地页 /p/:slug 独立挂载，勿套登录态布局（技术方案 §9）。
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/carriers' },

  {
    path: '/onboarding/avatar',
    name: 'onboarding-avatar',
    component: () => import('../views/onboarding/OnboardingAvatar.vue'),
    meta: { title: '选择头像' },
  },
  {
    path: '/onboarding/carrier',
    name: 'onboarding-carrier',
    component: () => import('../views/onboarding/OnboardingCarrier.vue'),
    meta: { title: '选择载体' },
  },
  {
    path: '/onboarding/first-item',
    name: 'onboarding-first-item',
    component: () => import('../views/onboarding/OnboardingFirstItem.vue'),
    meta: { title: '第一件物品' },
  },

  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/profile/ProfileHome.vue'),
    meta: { title: '个人中心' },
  },

  {
    path: '/carriers',
    name: 'carrier-list',
    component: () => import('../views/carrier/CarrierList.vue'),
    meta: { title: '我的载体' },
  },
  {
    path: '/carriers/directory',
    name: 'carrier-directory',
    component: () => import('../views/carrier/CarrierDirectory.vue'),
    meta: { title: '载体清单' },
  },
  {
    path: '/carriers/directory/change-avatar',
    name: 'carrier-directory-avatar',
    component: () => import('../views/onboarding/OnboardingAvatar.vue'),
    meta: { title: '更换头像' },
  },
  {
    path: '/carriers/:id',
    name: 'carrier-editor',
    component: () => import('../views/carrier/CarrierEditor.vue'),
    meta: { title: '场景编辑' },
  },
  {
    path: '/carriers/:id/theme',
    name: 'carrier-theme',
    component: () => import('../views/carrier/CarrierTheme.vue'),
    meta: { title: '载体样式' },
  },
  {
    path: '/carriers/:id/items',
    name: 'carrier-items',
    component: () => import('../views/item/ItemList.vue'),
    meta: { title: '物品列表' },
  },

  {
    path: '/items/new',
    name: 'item-new',
    component: () => import('../views/item/ItemCapture.vue'),
    meta: { title: '添加物品' },
  },
  {
    path: '/items/carrier-feed',
    name: 'carrier-item-feed',
    component: () => import('../views/carrier/CarrierItemFeed.vue'),
    meta: { title: '物品清单' },
  },
  {
    path: '/items/:id/ai',
    name: 'item-ai',
    component: () => import('../views/item/ItemAiChat.vue'),
    meta: { title: 'AI 对话' },
  },
  {
    path: '/items/card/view/:committedId',
    name: 'item-card-view',
    component: () => import('../views/item/ItemCard.vue'),
    meta: { title: '物品卡片' },
  },
  {
    path: '/items/:id/card',
    name: 'item-card',
    component: () => import('../views/item/ItemCard.vue'),
    meta: { title: '物品卡片' },
  },

  {
    path: '/share/preview/:carrierId',
    name: 'share-preview',
    component: () => import('../views/share/SharePreview.vue'),
    meta: { title: '分享预览' },
  },

  {
    path: '/p/:slug',
    name: 'public-share',
    component: () => import('../views/share/PublicShareLanding.vue'),
    meta: { title: '分享', publicLanding: true },
  },
]
