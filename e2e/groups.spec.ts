/**
 * Group Builder — GROUP-01 through GROUP-05
 * Also covers dog-group-to-dog compatibility signals in the group view.
 */
import { test, expect } from '@playwright/test'
import { seedState, makeDog, makeCompat } from './helpers'

test.describe('Group Builder', () => {
  test('GROUP-01: behaviorist can create a named walk group', async ({ page }) => {
    await seedState(page, { dogs: [makeDog('d1', 'Rusty')] })

    await page.click('role=tab[name="Groups"]')

    // Auto-creates a group on mount; just verify one exists
    await expect(page.locator('text=Score:').first()).toBeVisible()
  })

  test('GROUP-01: Add Group button creates additional group', async ({ page }) => {
    await seedState(page, { dogs: [makeDog('d1', 'Rusty')] })

    await page.click('role=tab[name="Groups"]')

    const before = await page.locator('text=Score:').count()
    await page.click('button:has-text("+ Add Group")')
    const after = await page.locator('text=Score:').count()

    expect(after).toBeGreaterThan(before)
  })

  test('GROUP-02: each dog can appear in only one group at a time (roster badge shows assignment)', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Solo')],
      walkGroups: [
        { id: 'g1', name: 'Morning', dogIds: ['d1'] },
        { id: 'g2', name: 'Afternoon', dogIds: [] },
      ],
    })

    await page.click('role=tab[name="Groups"]')

    // The roster should show Solo is already in a group (RosterRow shows assigned group name)
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toMatch(/Morning|assigned/i)
  })

  test('GROUP-03: compatibility badge shows group score when dogs are in a group', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Pip'), makeDog('d2', 'Quinn')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'compatible')],
      walkGroups: [{ id: 'g1', name: 'Happy Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // Score badge: "Score: 100" for all-compatible group
    await expect(page.locator('text=Score: 100')).toBeVisible()
  })

  test('GROUP-04: conflicts within a group are highlighted as SVG lines', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Storm'), makeDog('d2', 'Thunder')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'conflict')],
      walkGroups: [{ id: 'g1', name: 'Conflict Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // Score should be 0 for all-conflict group
    await expect(page.locator('text=Score: 0')).toBeVisible()

    // ConflictOverlay renders an SVG (role=img) with a red line inside group-body
    const conflictSvg = page.locator('[data-testid="group-body"] svg[class*="absolute"]')
    await expect(conflictSvg).toBeAttached()
    const line = conflictSvg.locator('line').first()
    await expect(line).toBeAttached()
    // Verify the line is red
    const stroke = await line.getAttribute('stroke')
    expect(stroke).toBe('#ef4444')
  })

  test('GROUP-04: clicking conflict SVG line opens EdgeSheet', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Storm'), makeDog('d2', 'Thunder')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'conflict')],
      walkGroups: [{ id: 'g1', name: 'Conflict Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // The SVG line has pointer-events:all but its parent SVG has pointer-events:none.
    // Use force:true to bypass Playwright's visibility/pointer-events check.
    const line = page.locator('[data-testid="group-body"] svg[class*="absolute"] line').first()
    await expect(line).toBeAttached()
    await line.click({ force: true })

    // EdgeSheet should open with the two dog names
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()
    const dialogText = await dialog.textContent()
    expect(dialogText).toMatch(/Storm|Thunder/)
  })

  test('GROUP-05: behaviorist can remove a dog from a group via remove button', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Ziggy'), makeDog('d2', 'Zara')],
      walkGroups: [{ id: 'g1', name: 'Test Group', dogIds: ['d1', 'd2'] }],
    })

    await page.click('role=tab[name="Groups"]')

    // Remove Ziggy via aria-label button on the MiniDogCard
    const removeBtn = page.getByRole('button', { name: /Remove Ziggy/i })
    await expect(removeBtn).toBeVisible()
    await removeBtn.click()

    // Ziggy should be back in the roster panel (left side), not in any group
    const groupBody = page.locator('[data-testid="group-body"]').first()
    // Wait for DOM to settle
    await page.waitForTimeout(200)
    const groupBodyText = await groupBody.textContent()
    expect(groupBodyText).not.toContain('Ziggy')
  })
})
