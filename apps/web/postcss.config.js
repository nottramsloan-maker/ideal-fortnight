export default {
  plugins: {
    'postcss-px-to-viewport': {
      viewportWidth: 390,
      unitPrecision: 5,
      viewportUnit: 'vw',
      selectorBlackList: [/^\.ignore-vw$/],
      minPixelValue: 1,
      mediaQuery: false,
      // 避免把 scale(min(calc(.../390)...)) 等复杂表达式里的数字转成 vw 导致 scale 失效 → 白屏
      exclude: [/OnboardingAvatar\.vue/, /OnboardingCarrier\.vue/],
    },
  },
}
