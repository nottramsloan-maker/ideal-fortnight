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
      exclude: [
        /OnboardingAvatar\.vue/,
        /OnboardingCarrier\.vue/,
        /ItemPhotoCapture\.vue/,
        /ItemAiChat\.vue/,
        // 避免改写 :root 字号/圆角等 token，保证全站 font-family 变量稳定
        /design-tokens\.scss$/,
        /global\.scss$/,
      ],
    },
  },
}
