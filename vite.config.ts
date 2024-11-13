import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import monkey from 'vite-plugin-monkey'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core'
      ],
    }),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://api.iconify.design/hugeicons:translation.svg?color=%230080ff',
        name: 'FF14 Lodestone 自动翻译',
        namespace: 'unlucky.ninja',
        author: 'UnluckyNinja',
        match: ['https://jp.finalfantasyxiv.com/lodestone/topics/detail/*'],
        connect: [
          'translate.googleapis.com'
        ]
      },
      // build: {
      //   externalGlobals: {
      //     vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
      //   },
      // },
    }),
  ],
})
