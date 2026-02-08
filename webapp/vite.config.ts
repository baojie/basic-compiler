/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/basic-compiler/',
  plugins: [react()],
  test: {
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
})
