import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages project page (DEPLOYMENT.md): served at mrrishit909.github.io/counterfactual-city/,
  // matching this account's other project repos (cascadia). The panel-data fetch
  // (src/engine/loadPanel.ts) already builds its URL from import.meta.env.BASE_URL, so no other path
  // needed changing to support this.
  base: '/counterfactual-city/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.ts',
    // vitest's default glob also matches Playwright's e2e/*.spec.ts, which
    // errors because those files call test() outside Playwright's runner.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
