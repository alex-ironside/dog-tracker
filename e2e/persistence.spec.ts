/**
 * Persistence — FOUND-01, FOUND-02, FOUND-03
 */
import { test, expect } from '@playwright/test'
import { seedState, makeDog } from './helpers'

test.describe('LocalStorage persistence', () => {
  test('FOUND-01/02: app state persists and restores from localStorage', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Persisted')],
    })

    await page.click('role=tab[name="Dogs"]')
    await expect(page.getByText('Persisted').first()).toBeVisible()

    // Reload the page — state should survive
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.click('role=tab[name="Dogs"]')

    await expect(page.getByText('Persisted').first()).toBeVisible()
  })

  test('FOUND-01: adding a dog immediately persists to localStorage', async ({ page }) => {
    await seedState(page, {})

    await page.click('role=tab[name="Dogs"]')
    await page.click('button:has-text("Add Dog")')

    await expect(page.getByRole('heading', { name: 'Add Dog' })).toBeVisible()

    await page.getByLabel('Name').fill('Instant')
    await page.getByLabel('Breed').fill('Beagle')

    await page.getByRole('button', { name: 'Save' }).click()

    // Sheet should close; then verify localStorage
    await expect(page.getByRole('heading', { name: 'Add Dog' })).not.toBeVisible({ timeout: 3000 })

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('dogTracker-store')
      if (!raw) return null
      return JSON.parse(raw)
    })

    expect(stored).not.toBeNull()
    expect(JSON.stringify(stored)).toContain('Instant')
  })

  test('FOUND-03: localStorage has schemaVersion field', async ({ page }) => {
    await seedState(page, { dogs: [makeDog('d1', 'Versioned')] })

    const stored = await page.evaluate(() => {
      const raw = localStorage.getItem('dogTracker-store')
      if (!raw) return null
      return JSON.parse(raw)
    })

    expect(stored).not.toBeNull()
    expect(JSON.stringify(stored)).toMatch(/schemaVersion/)
  })
})

test.describe('Tab navigation', () => {
  test('All five tabs are reachable', async ({ page }) => {
    await seedState(page, {})

    for (const tabName of ['Dogs', 'Compatibility', 'Groups', 'Calendar', 'History']) {
      const tab = page.locator(`role=tab[name="${tabName}"]`)
      await expect(tab).toBeVisible()
      await tab.click()
      await expect(tab).toHaveAttribute('aria-selected', 'true')
    }
  })
})
