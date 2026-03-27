import { describe, it, expect, beforeEach } from 'vitest'
import { create } from 'zustand'
import { createDogSlice, type DogActions } from './dogSlice'
import type { AppState } from '@/types'

type TestStore = AppState & DogActions

function createTestStore() {
  return create<TestStore>()((...a) => ({
    schemaVersion: 1,
    dogs: [],
    walkGroups: [],
    compatibilityEntries: [],
    walkSessions: [],
    ...createDogSlice(...a),
  }))
}

describe('dogSlice', () => {
  let store: ReturnType<typeof createTestStore>

  beforeEach(() => {
    store = createTestStore()
  })

  it('addDog creates a dog with generated UUID id', () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const dogs = store.getState().dogs
    expect(dogs[0].id).toBeDefined()
    expect(dogs[0].id).toHaveLength(36) // UUID format
  })

  it('addDog creates a dog with archived=false', () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    expect(store.getState().dogs[0].archived).toBe(false)
  })

  it('addDog creates a dog with createdAt and updatedAt timestamps', () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const dog = store.getState().dogs[0]
    expect(dog.createdAt).toBeDefined()
    expect(dog.updatedAt).toBeDefined()
    expect(new Date(dog.createdAt).toISOString()).toBe(dog.createdAt)
    expect(new Date(dog.updatedAt).toISOString()).toBe(dog.updatedAt)
  })

  it("addDog with name='Rex', breed='Labrador', age=3, notes='' results in dogs[0].name === 'Rex' and length 1", () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const dogs = store.getState().dogs
    expect(dogs).toHaveLength(1)
    expect(dogs[0].name).toBe('Rex')
    expect(dogs[0].breed).toBe('Labrador')
    expect(dogs[0].age).toBe(3)
  })

  it('updateDog changes breed and updates updatedAt', async () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const { id, updatedAt: originalUpdatedAt } = store.getState().dogs[0]

    await new Promise((r) => setTimeout(r, 5))

    store.getState().updateDog(id, { breed: 'Golden Retriever' })
    const updated = store.getState().dogs[0]

    expect(updated.breed).toBe('Golden Retriever')
    expect(updated.updatedAt).not.toBe(originalUpdatedAt)
  })

  it('updateDog does not change createdAt', async () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const { id, createdAt } = store.getState().dogs[0]

    await new Promise((r) => setTimeout(r, 5))

    store.getState().updateDog(id, { breed: 'Golden Retriever' })
    expect(store.getState().dogs[0].createdAt).toBe(createdAt)
  })

  it('archiveDog sets archived=true and updates updatedAt', async () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const { id, updatedAt: originalUpdatedAt } = store.getState().dogs[0]

    await new Promise((r) => setTimeout(r, 5))

    store.getState().archiveDog(id)
    const dog = store.getState().dogs[0]

    expect(dog.archived).toBe(true)
    expect(dog.updatedAt).not.toBe(originalUpdatedAt)
  })

  it('unarchiveDog sets archived=false and updates updatedAt', async () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    const { id } = store.getState().dogs[0]
    store.getState().archiveDog(id)

    await new Promise((r) => setTimeout(r, 5))
    const archivedUpdatedAt = store.getState().dogs[0].updatedAt

    await new Promise((r) => setTimeout(r, 5))
    store.getState().unarchiveDog(id)
    const dog = store.getState().dogs[0]

    expect(dog.archived).toBe(false)
    expect(dog.updatedAt).not.toBe(archivedUpdatedAt)
  })

  it('adding multiple dogs results in correct array length', () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    store.getState().addDog({ name: 'Buddy', breed: 'Beagle', age: 2, notes: '' })
    store.getState().addDog({ name: 'Luna', breed: 'Poodle', age: 5, notes: '' })
    expect(store.getState().dogs).toHaveLength(3)
  })

  it('archiving one dog does not affect other dogs', () => {
    store.getState().addDog({ name: 'Rex', breed: 'Labrador', age: 3, notes: '' })
    store.getState().addDog({ name: 'Buddy', breed: 'Beagle', age: 2, notes: '' })

    const rexId = store.getState().dogs[0].id
    store.getState().archiveDog(rexId)

    const buddy = store.getState().dogs.find((d) => d.name === 'Buddy')
    expect(buddy?.archived).toBe(false)
  })
})
