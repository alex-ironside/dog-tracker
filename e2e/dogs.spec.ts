/**
 * Dog Roster — DOGS-01 through DOGS-04
 */
import { test, expect } from '@playwright/test'
import { seedState, makeDog } from './helpers'

test.describe('Dog Roster', () => {
  test('DOGS-01: behaviorist can add a dog with name, breed, age, and notes', async ({ page }) => {
    await seedState(page, {})

    await page.click('role=tab[name="Dogs"]')
    await page.click('button:has-text("Add Dog")')

    // Sheet opens — wait for the form
    await expect(page.getByRole('heading', { name: 'Add Dog' })).toBeVisible()

    await page.getByLabel('Name').fill('Rex')
    await page.getByLabel('Breed').fill('Labrador')
    await page.getByLabel('Age').fill('4')
    await page.getByLabel('Notes').fill('Loves water')

    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByText('Rex')).toBeVisible()
  })

  test('DOGS-03: archived dogs are hidden from active roster', async ({ page }) => {
    await seedState(page, {
      dogs: [
        makeDog('d1', 'Buddy'),
        makeDog('d2', 'Max', { archived: true }),
      ],
    })

    await page.click('role=tab[name="Dogs"]')

    await expect(page.getByText('Buddy').first()).toBeVisible()
    await expect(page.getByText('Max')).not.toBeVisible()
  })

  test('DOGS-04: behaviorist can view full roster of active dogs', async ({ page }) => {
    await seedState(page, {
      dogs: [
        makeDog('d1', 'Alpha'),
        makeDog('d2', 'Beta'),
        makeDog('d3', 'Gamma'),
      ],
    })

    await page.click('role=tab[name="Dogs"]')

    await expect(page.getByText('Alpha').first()).toBeVisible()
    await expect(page.getByText('Beta').first()).toBeVisible()
    await expect(page.getByText('Gamma').first()).toBeVisible()
  })
})
