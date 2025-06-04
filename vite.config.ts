import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import UnoCSS from 'unocss/vite'
import monkey from 'vite-plugin-monkey'
import Inspect from 'vite-plugin-inspect'
import { fileURLToPath } from 'node:url'
import packgeJson from './package.json'
import Rexport from './plugin/rexport'

export default defineConfig((config)=>({
  plugins: [
    vue(),
    Rexport(),
    UnoCSS(),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core'
      ],
    }),
    // import text file will cause error
    config.mode === 'test' ? undefined : monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://api.iconify.design/hugeicons:translation.svg?color=%230080ff',
        version: process.env.RESOLVED_VERSION ?? packgeJson.version,
        name: 'FF14 Lodestone 自动翻译',
        namespace: 'unlucky.ninja',
        author: 'UnluckyNinja',
        match: [
          'https://jp.finalfantasyxiv.com/lodestone/topics/detail/*',
          'https://na.finalfantasyxiv.com/lodestone/topics/detail/*',
        ],
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
    Inspect()
  ],
  
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
}))
