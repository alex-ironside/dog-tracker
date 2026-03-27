export interface StorageAdapter {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
  getRawJSON: () => string | null
  setRawJSON: (json: string) => void
}

const STORE_KEY = 'dogTracker-store'

export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string) {
    return localStorage.getItem(key)
  }

  setItem(key: string, value: string) {
    localStorage.setItem(key, value)
  }

  removeItem(key: string) {
    localStorage.removeItem(key)
  }

  getRawJSON() {
    return localStorage.getItem(STORE_KEY)
  }

  setRawJSON(json: string) {
    localStorage.setItem(STORE_KEY, json)
  }
}
