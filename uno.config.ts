import { defineConfig, presetTypography, presetUno, presetIcons } from 'unocss'

export default defineConfig({
  // ...UnoCSS options
  presets: [
    presetUno(),
    presetIcons(),
    presetTypography(),
  ],
})