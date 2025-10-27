import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import eslint from 'vite-plugin-eslint'

import path from 'path'

import fs from 'fs'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), eslint()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@app': path.resolve(__dirname, 'src/app'),
            '@core': path.resolve(__dirname, 'src/core'),
            '@views': path.resolve(__dirname, 'src/app/views'),
            '@assets': path.resolve(__dirname, './src/assets'),
            '@store': path.resolve(__dirname, './src/app/store'),
            '@hooks': path.resolve(__dirname, './src/hooks')
        }
    },
    // server: {
    //     host: 'devcerebrum.holisol.test'
    //     // host: '127.0.0.1'
    // },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
        css: true
    }
})
