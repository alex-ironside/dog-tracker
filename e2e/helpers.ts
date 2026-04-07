import type { Page } from '@playwright/test'

/** Seed localStorage with a known app state and reload, so tests start deterministic. */
export async function seedState(page: Page, partial: Partial<{
  dogs: object[],
  walkGroups: object[],
  compatibilityEntries: object[],
  walkSessions: object[],
  walkHistory: object[],
}>) {
  const state = {
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    walkHistory: [],
    ...partial,
  }
  await page.goto('/')
  await page.evaluate((s) => {
    localStorage.setItem('dogTracker-store', JSON.stringify({ state: s, version: 1 }))
  }, state)
  await page.reload()
  await page.waitForLoadState('networkidle')
}

export function makeDog(id: string, name: string, overrides: object = {}) {
  return {
    id,
    name,
    breed: 'Mixed',
    age: 3,
    notes: '',
    archived: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }
}

export function makeCompat(dogIdA: string, dogIdB: string, status: string) {
  return { dogIdA, dogIdB, status }
}
