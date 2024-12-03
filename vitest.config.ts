import { resolve } from 'path'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        '@vueuse/core'
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    watch: false,
    globalSetup: './global-setup.ts',
    pool: 'threads',
    poolOptions: {
      threads: {
        execArgv: [
          // https://nodejs.org/api/cli.html#--cpu-prof
          '--cpu-prof',
          '--cpu-prof-dir=threads-profile',

          // https://nodejs.org/api/cli.html#--heap-prof
          '--heap-prof',
          '--heap-prof-dir=threads-profile',
        ],

        // Generate a single profile
        singleThread: true,
      },

      forks: {
        execArgv: [
          // https://nodejs.org/api/cli.html#--cpu-prof
          '--cpu-prof',
          '--cpu-prof-dir=forks-profile',

          // https://nodejs.org/api/cli.html#--heap-prof
          '--heap-prof',
          '--heap-prof-dir=forks-profile',
        ],

        // Generate a single profile
        singleFork: true,
      },
    },
    alias: {
      '$': resolve('./__mocks__/$.ts')
    }
  },
})
