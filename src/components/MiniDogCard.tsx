import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

type MiniDogCardProps = {
  dogName: string
  onRemove: () => void
}

export function MiniDogCard({ dogName, onRemove }: MiniDogCardProps) {
  const { t } = useTranslation()
  return (
    <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted border border-border text-sm text-foreground'>
      <span>{dogName}</span>
      <button
        type='button'
        onClick={onRemove}
        aria-label={t('groups.removeDogAria', { name: dogName, defaultValue: `Remove ${dogName} from group` })}
        className='p-0 h-4 w-4 inline-flex items-center justify-center text-muted-foreground/70 hover:text-destructive'
      >
        <X size={12} />
      </button>
    </div>
  )
}
