import type { CompatibilityStatus } from '@/types'

const BADGE_STYLES: Record<CompatibilityStatus, string> = {
  compatible: 'bg-green-100 text-green-700',
  neutral: 'bg-slate-100 text-slate-600',
  conflict: 'bg-red-100 text-red-700',
  unknown: 'bg-slate-50 text-slate-400 border border-dashed border-slate-300',
}

export function CompatBadge({ status }: { status: CompatibilityStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLES[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}
