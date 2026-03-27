import { X } from 'lucide-react'

type MiniDogCardProps = {
  dogName: string
  onRemove: () => void
}

export function MiniDogCard({ dogName, onRemove }: MiniDogCardProps) {
  return (
    <div className='inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-sm text-slate-900'>
      <span>{dogName}</span>
      <button
        type='button'
        onClick={onRemove}
        aria-label={`Remove ${dogName} from group`}
        className='p-0 h-4 w-4 inline-flex items-center justify-center text-slate-400 hover:text-red-500'
      >
        <X size={12} />
      </button>
    </div>
  )
}
