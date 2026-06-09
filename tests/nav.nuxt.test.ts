// @vitest-environment nuxt
import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppBottomNav from '../app/components/AppBottomNav.vue'

describe('AppBottomNav', () => {
  it('renders the five primary tabs with correct routes', async () => {
    const wrapper = await mountSuspended(AppBottomNav)
    const hrefs = wrapper.findAll('a').map((a) => a.attributes('href'))
    for (const route of ['/', '/timeline', '/vault', '/ask', '/settings']) {
      expect(hrefs).toContain(route)
    }
  })

  it('shows the (English) tab labels', async () => {
    const wrapper = await mountSuspended(AppBottomNav)
    const text = wrapper.text()
    for (const label of ['Dashboard', 'Timeline', 'Vault', 'Ask', 'Settings']) {
      expect(text).toContain(label)
    }
  })
})
