import { defineVitestConfig } from '@nuxt/test-utils/config'

// Default env is 'node' (fast pure-logic tests). Component/integration tests opt
// into the Nuxt runtime with a `// @vitest-environment nuxt` comment at the top.
export default defineVitestConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts']
  }
})
