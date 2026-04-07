import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from './ui/input'
import { cn } from '@/lib/utils'

export function useDogSearch<T extends { name: string }>(dogs: T[]) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return dogs
    return dogs.filter((d) => d.name.toLowerCase().includes(q))
  }, [dogs, query])
  return { query, setQuery, filtered }
}

export interface DogSearchInputProps {
  value: string
  onChange: (v: string) => void
  className?: string
}

export function DogSearchInput({ value, onChange, className }: DogSearchInputProps) {
  const { t } = useTranslation()
  const placeholder = t('picker.searchPlaceholder')
  return (
    <div className={cn('relative', className)}>
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={value.length > 0 ? 'pr-9' : undefined}
      />
      {value.length > 0 && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label={t('picker.clearSearch')}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm px-1.5 py-0.5 text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          ×
        </button>
      )}
    </div>
  )
}
