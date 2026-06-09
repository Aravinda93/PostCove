// Workaround for an upstream tooling mismatch:
// Nuxt 4.4.7 writes a `vue-router/volar/sfc-route-blocks` Volar plugin into the
// generated .nuxt tsconfigs, but vue-router 4.x doesn't export that subpath, so
// `vue-tsc` crashes before checking anything. The runtime build is unaffected.
// This script strips that single plugin entry from the generated configs right
// before type-checking. Remove once Nuxt/vue-router ship a compatible pair.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const files = ['.nuxt/tsconfig.json', '.nuxt/tsconfig.app.json']
let patched = 0

for (const file of files) {
  if (!existsSync(file)) continue
  const cfg = JSON.parse(readFileSync(file, 'utf8'))
  const plugins = cfg.vueCompilerOptions?.plugins
  if (Array.isArray(plugins)) {
    const next = plugins.filter((p) => !String(p).includes('vue-router/volar'))
    if (next.length !== plugins.length) {
      cfg.vueCompilerOptions.plugins = next
      writeFileSync(file, JSON.stringify(cfg, null, 2))
      patched++
    }
  }
}

console.log(`patch-tsconfig: stripped vue-router/volar plugin from ${patched} file(s).`)
