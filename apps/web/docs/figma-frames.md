# Figma ↔ 页面映射（兴趣清单 H5）

维护方式：在 Figma 选中 Frame → 复制分享链接（含 `node-id`）→ 填入下表。开发任务描述中附带同一链接，便于与设计稿对齐（技术方案 §2.5、§3.2）。

| 路由 | Vue 页面 | Figma Page / Frame 名 | Figma 链接（含 node-id） |
|------|----------|------------------------|---------------------------|
| `/onboarding/avatar` | `views/onboarding/OnboardingAvatar.vue` | 形象设置 | [node 150:369](https://www.figma.com/design/vt9q9x6LlIuiKtlIoLy6FR/%E8%8D%89%E7%A8%BF?node-id=150-369) |
| `/onboarding/carrier` | `views/onboarding/OnboardingCarrier.vue` | 载体选择（PRD 4.2.1） | [node 150:484](https://www.figma.com/design/vt9q9x6LlIuiKtlIoLy6FR/%E8%8D%89%E7%A8%BF?node-id=150-484) |
| `/onboarding/first-item` | `views/onboarding/OnboardingFirstItem.vue` | 待填 | 待填 |
| `/profile` | `views/profile/ProfileHome.vue` | 待填 | 待填 |
| `/carriers` | `views/carrier/CarrierList.vue` | 待填 | 待填 |
| `/carriers/:id` | `views/carrier/CarrierEditor.vue` | 待填 | 待填 |
| `/carriers/:id/theme` | `views/carrier/CarrierTheme.vue` | 待填 | 待填 |
| `/carriers/:id/items` | `views/item/ItemList.vue` | 待填 | 待填 |
| `/items/new` | `views/item/ItemCapture.vue` | 待填 | 待填 |
| `/items/:id/ai` | `views/item/ItemAiChat.vue` | 待填 | 待填 |
| `/items/:id/card` | `views/item/ItemCard.vue` | 物品卡片（Done 后） | [node 150:769](https://www.figma.com/design/vt9q9x6LlIuiKtlIoLy6FR/%E8%8D%89%E7%A8%BF?node-id=150-769) |
| `/share/preview/:carrierId` | `views/share/SharePreview.vue` | 待填（成品卡 §7.3.1） | 待填 |
| `/p/:slug` | `views/share/PublicShareLanding.vue` | 待填（外链落地 §7.3.2） | 待填 |

## 组件级 Frame（可选）

| 组件路径 | Figma 组件/Frame | 链接 |
|----------|------------------|------|
| `components/AppHeader.vue` | 待填 | 待填 |
| `components/AvatarPicker.vue` | 待填 | 待填 |
| `components/PoemSwitch.vue` | 待填 | 待填 |
| `components/ShareExportPanel.vue` | 待填 | 待填 |
| `components/CarrierDirectoryPublic.vue` | 待填 | 待填 |

## 切图目录

导出资源建议放入 `src/assets/figma/`，按页面或模块分子目录（技术方案 §9）。
