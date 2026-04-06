/**
 * 微信小程序 web-view 内，Pinia 依赖的 @vue/devtools-api v7 可能在残缺环境下抛错
 *（如 TypeError: Cannot read properties of undefined (reading 'service')）。
 * 仅在 vite --mode miniwebview 时通过 alias 启用本桩，关闭 DevTools 插件注册。
 */
export function setupDevtoolsPlugin(
  _pluginDescriptor: unknown,
  _setupFn: (api: unknown) => void,
): void {
  // no-op
}
