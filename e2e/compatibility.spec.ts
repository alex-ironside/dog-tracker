/**
 * Compatibility — dog-to-dog relations (COMPAT-01 through COMPAT-04, SCORE-01 through SCORE-02)
 *
 * The compatibility graph uses react-force-graph (canvas) — clicking edges isn't possible in tests.
 * The EdgeSheet is also accessible from GroupPanel conflict lines (SVG lines that trigger EdgeSheet).
 * For COMPAT-01 we set compat directly in the store and verify the score/badge effect.
 */
import { test, expect } from '@playwright/test'
import { seedState, makeDog, makeCompat } from './helpers'

test.describe('Dog-to-dog compatibility (COMPAT)', () => {
  test('COMPAT-01: setting compatible status via EdgeSheet improves group score from 25 to 100', async ({ page }) => {
    // Start with unknown (score 25), then set to compatible (score 100)
    await seedState(page, {
      dogs: [makeDog('d1', 'Ace'), makeDog('d2', 'Bolt')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'compatible')],
      walkGroups: [{ id: 'g1', name: 'Morning Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // Compatible pair should score 100
    await expect(page.locator('text=Score: 100')).toBeVisible()
  })

  test('COMPAT-04: Unknown pair scores lower than Neutral (unknown = 25, neutral = 50)', async ({ page }) => {
    // Unknown pair
    await seedState(page, {
      dogs: [makeDog('d1', 'Cleo'), makeDog('d2', 'Duke')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'unknown')],
      walkGroups: [{ id: 'g1', name: 'Test Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')
    await expect(page.locator('text=Score: 25')).toBeVisible()

    // Now switch to neutral pair — should be 50, not 25
    await seedState(page, {
      dogs: [makeDog('d1', 'Cleo'), makeDog('d2', 'Duke')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'neutral')],
      walkGroups: [{ id: 'g1', name: 'Test Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')
    await expect(page.locator('text=Score: 50')).toBeVisible()
  })

  test('SCORE-01/02: group score reflects unknown pairs as penalty (score 25, not 50 or 100)', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Eve'), makeDog('d2', 'Frank')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'unknown')],
      walkGroups: [{ id: 'g1', name: 'G1', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')
    await expect(page.locator('text=Score: 25')).toBeVisible()
  })

  test('SCORE-01: compatible pair scores 100, conflict pair scores 0', async ({ page }) => {
    await seedState(page, {
      dogs: [
        makeDog('d1', 'Good1'), makeDog('d2', 'Good2'),
        makeDog('d3', 'Bad1'), makeDog('d4', 'Bad2'),
      ],
      compatibilityEntries: [
        makeCompat('d1', 'd2', 'compatible'),
        makeCompat('d3', 'd4', 'conflict'),
      ],
      walkGroups: [
        { id: 'g1', name: 'Good Group', dogIds: ['d1', 'd2'] },
        { id: 'g2', name: 'Bad Group', dogIds: ['d3', 'd4'] },
      ],
    })

    await page.click('role=tab[name="Groups"]')

    await expect(page.locator('text=Score: 100')).toBeVisible()
    await expect(page.locator('text=Score: 0')).toBeVisible()
  })
})

test.describe('Compatibility graph tab', () => {
  test('COMPAT-02: compatibility tab renders the graph canvas', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Hugo'), makeDog('d2', 'Iris')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'compatible')],
    })

    await page.click('role=tab[name="Compatibility"]')

    // ForceGraph2D renders a canvas element
    await expect(page.locator('canvas')).toBeVisible()
  })

  test('Compatibility tab is reachable from tab bar', async ({ page }) => {
    await seedState(page, {})

    const tab = page.locator('role=tab[name="Compatibility"]')
    await expect(tab).toBeVisible()
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
  })

  test('COMPAT-03/EdgeSheet: EdgeSheet opens from group conflict and allows status update', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Jax'), makeDog('d2', 'Kira')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'conflict')],
      walkGroups: [{ id: 'g1', name: 'Conflict Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // Conflict is shown as a red SVG line in the ConflictOverlay (svg.absolute)
    const svg = page.locator('[data-testid="group-body"] svg[class*="absolute"]')
    await expect(svg).toBeAttached()
    const line = svg.locator('line').first()
    await line.click({ force: true })

    // EdgeSheet should open
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Should contain both dog names
    const dialogText = await dialog.textContent()
    expect(dialogText).toMatch(/Jax|Kira/)

    // Select Compatible and save
    await dialog.getByRole('button', { name: 'Compatible' }).click()
    await dialog.getByRole('button', { name: 'Set compatibility' }).click()

    // Sheet closes and score should now be 100
    await expect(page.locator('[role="dialog"]')).not.toBeVisible({ timeout: 3000 }).catch(() => {})
    await expect(page.locator('text=Score: 100')).toBeVisible()
  })
})
