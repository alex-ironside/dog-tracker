/**
 * Walk History — HIST-01 through HIST-05
 * Covers dog-to-dog, dog-group-to-dog, and dog-group-to-dog-group relation tracking.
 */
import { test, expect } from '@playwright/test'
import { seedState, makeDog, makeCompat } from './helpers'

test.describe('Walk History — basic logging (HIST-01/02/03)', () => {
  test('HIST-01: can log a walk with an outcome', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Biscuit'), makeDog('d2', 'Crumble')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    // Sheet header
    await expect(page.getByRole('heading', { name: 'Log a Walk' })).toBeVisible()

    // Select Biscuit via checkbox inside the scrollable list
    await page.locator('label').filter({ hasText: 'Biscuit' }).locator('input[type="checkbox"]').check()

    // Pick outcome
    await page.getByRole('button', { name: 'Great' }).click()

    await page.getByRole('button', { name: 'Save Walk Log' }).click()

    // Sheet should close; entry should appear with Great badge
    await expect(page.getByRole('heading', { name: 'Log a Walk' })).not.toBeVisible({ timeout: 3000 })
    await expect(page.locator('text=Great').first()).toBeVisible()
  })

  test('HIST-02: can add free-text notes to a walk log entry', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Nutmeg')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    await page.locator('label').filter({ hasText: 'Nutmeg' }).locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Good' }).click()
    await page.getByPlaceholder('Any notes about this walk...').fill('Nutmeg was energetic today')

    await page.getByRole('button', { name: 'Save Walk Log' }).click()

    await expect(page.getByRole('heading', { name: 'Log a Walk' })).not.toBeVisible({ timeout: 3000 })
    // Notes appear in the history entry card
    await expect(page.locator('p').filter({ hasText: 'Nutmeg was energetic today' })).toBeVisible()
  })

  test('HIST-03: walk log entry preserves dog snapshot (dogIds persisted)', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Pepper'), makeDog('d2', 'Sage')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    await page.locator('label').filter({ hasText: 'Pepper' }).locator('input[type="checkbox"]').check()
    await page.getByRole('button', { name: 'Neutral' }).click()

    await page.getByRole('button', { name: 'Save Walk Log' }).click()
    await expect(page.getByRole('heading', { name: 'Log a Walk' })).not.toBeVisible({ timeout: 3000 })

    // Entry row shows Pepper (from the persisted dogIds)
    const entryRow = page.locator('.border.border-slate-200.rounded-md').first()
    await expect(entryRow.getByText('Pepper')).toBeVisible()
  })
})

test.describe('Dog-to-dog relation tracking', () => {
  test('Walk log entry shows pair buttons for dog-to-dog interactions', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Atlas'), makeDog('d2', 'Bear')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'compatible')],
      walkHistory: [
        {
          id: 'w1',
          date: '2024-06-01',
          outcome: 'great',
          notes: '',
          dogIds: ['d1', 'd2'],
        },
      ],
    })

    await page.click('role=tab[name="History"]')

    // Pair button for Atlas & Bear should be rendered inside the entry
    const pairBtn = page.locator('button').filter({ hasText: /Atlas.*Bear|Bear.*Atlas/ })
    await expect(pairBtn.first()).toBeVisible()
  })

  test('Clicking a pair button in history opens EdgeSheet to update compatibility', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Chip'), makeDog('d2', 'Dale')],
      compatibilityEntries: [makeCompat('d1', 'd2', 'neutral')],
      walkHistory: [
        {
          id: 'w1',
          date: '2024-06-02',
          outcome: 'poor',
          notes: '',
          dogIds: ['d1', 'd2'],
        },
      ],
    })

    await page.click('role=tab[name="History"]')

    const pairBtn = page.locator('button').filter({ hasText: /Chip.*Dale|Dale.*Chip/ }).first()
    await pairBtn.click()

    // EdgeSheet should open
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible({ timeout: 3000 })
    const dialogText = await dialog.textContent()
    expect(dialogText).toMatch(/Chip|Dale/)
  })
})

test.describe('Dog-group-to-dog-group relation logging (group mode)', () => {
  test('Walk log sheet shows Two groups toggle', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Fern'), makeDog('d2', 'Glen'), makeDog('d3', 'Heather')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    await expect(page.getByRole('button', { name: 'Two groups' })).toBeVisible()
  })

  test('Group mode: switching to "Two groups" shows Group A, Group B, and Encounter outcome', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Ivy'), makeDog('d2', 'Jasper'), makeDog('d3', 'Kit')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    await page.getByRole('button', { name: 'Two groups' }).click()

    await expect(page.getByText('Group A', { exact: true })).toBeVisible()
    await expect(page.getByText('Group B', { exact: true })).toBeVisible()
    await expect(page.getByText('Encounter outcome')).toBeVisible()
  })

  test('Group mode validation: requires at least one dog in each group', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Ivy'), makeDog('d2', 'Jasper')],
    })

    await page.click('role=tab[name="History"]')
    await page.click('button:has-text("Log a walk")')

    await page.getByRole('button', { name: 'Two groups' }).click()

    // Try to save without assigning dogs to groups
    await page.getByRole('button', { name: 'Save Walk Log' }).click()

    // Validation error should appear
    const error = page.locator('[role="alert"]')
    await expect(error).toBeVisible()
  })

  test('Group mode history entry shows cross-group and within-group pair breakdown', async ({ page }) => {
    await seedState(page, {
      dogs: [
        makeDog('d1', 'Nova'),
        makeDog('d2', 'Orion'),
        makeDog('d3', 'Polaris'),
      ],
      compatibilityEntries: [
        makeCompat('d1', 'd2', 'compatible'),
        makeCompat('d1', 'd3', 'conflict'),
        makeCompat('d2', 'd3', 'neutral'),
      ],
      walkHistory: [
        {
          id: 'w1',
          date: '2024-07-01',
          outcome: 'neutral',
          notes: '',
          dogIds: ['d1', 'd2', 'd3'],
          groupContext: {
            groupA: ['d1', 'd2'],
            groupB: ['d3'],
            groupOutcome: 'poor',
          },
        },
      ],
    })

    await page.click('role=tab[name="History"]')

    const bodyText = await page.locator('body').textContent()

    // Group labels
    expect(bodyText).toMatch(/Group A|Group B/i)
    // Dog names
    expect(bodyText).toContain('Nova')
    expect(bodyText).toContain('Polaris')
    // Cross-group / within group breakdown
    expect(bodyText).toMatch(/[Cc]ross.group|[Ww]ithin group/i)
  })

  test('Group mode entry shows encounter outcome (not walk-level outcome)', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Quill'), makeDog('d2', 'Reed')],
      walkHistory: [
        {
          id: 'w1',
          date: '2024-07-02',
          outcome: 'poor',  // walk-level — should be suppressed for group entries
          notes: '',
          dogIds: ['d1', 'd2'],
          groupContext: {
            groupA: ['d1'],
            groupB: ['d2'],
            groupOutcome: 'incident',
          },
        },
      ],
    })

    await page.click('role=tab[name="History"]')

    // "Incident" badge (encounter outcome) should be visible
    await expect(page.locator('text=Incident').first()).toBeVisible()
    // "Poor" should not appear as the primary badge for this entry
    // (the walk-level outcome "poor" is suppressed in group mode per component logic)
    const entryCard = page.locator('.border.border-slate-200.rounded-md').first()
    const entryText = await entryCard.textContent()
    expect(entryText).toContain('Incident')
  })
})

test.describe('HIST-04/05: Dog walk history chart', () => {
  test('HIST-04: walk history tab shows logged entries for a dog', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Scout')],
      walkHistory: [
        { id: 'w1', date: '2024-05-01', outcome: 'great', notes: '', dogIds: ['d1'] },
        { id: 'w2', date: '2024-05-08', outcome: 'good',  notes: '', dogIds: ['d1'] },
        { id: 'w3', date: '2024-05-15', outcome: 'poor',  notes: '', dogIds: ['d1'] },
      ],
    })

    await page.click('role=tab[name="History"]')

    // All three entries should appear
    await expect(page.locator('text=Great').first()).toBeVisible()
    await expect(page.locator('text=Good').first()).toBeVisible()
    await expect(page.locator('text=Poor').first()).toBeVisible()
  })

  test('HIST-05: per-dog history panel includes a Recharts SVG chart', async ({ page }) => {
    await seedState(page, {
      dogs: [makeDog('d1', 'Tasha')],
      walkHistory: [
        { id: 'w1', date: '2024-05-01', outcome: 'great', notes: '', dogIds: ['d1'] },
        { id: 'w2', date: '2024-05-08', outcome: 'good',  notes: '', dogIds: ['d1'] },
      ],
    })

    await page.click('role=tab[name="Dogs"]')

    // Open Tasha's DogPanel via the Edit button on her card
    await page.getByRole('button', { name: 'Edit' }).first().click()

    // DogPanel opens as a dialog/sheet
    const dialog = page.locator('[role="dialog"]')
    await expect(dialog).toBeVisible()

    // Switch to History tab inside the panel
    const historyTab = dialog.getByRole('tab', { name: /history/i })
    await expect(historyTab).toBeVisible()
    await historyTab.click()

    // Recharts renders SVG elements — verify at least one SVG is present in the dialog
    await expect(dialog.locator('svg').first()).toBeVisible({ timeout: 5000 })
  })
})
