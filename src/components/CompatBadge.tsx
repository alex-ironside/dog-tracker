import { useTranslation } from 'react-i18next'
import type { CompatibilityStatus } from '@/types'

const BADGE_STYLES: Record<CompatibilityStatus, string> = {
  compatible: 'bg-accent/20 text-accent border border-accent/40',
  neutral: 'bg-muted text-muted-foreground border border-border',
  conflict: 'bg-destructive/15 text-destructive border border-destructive/40',
  unknown: 'bg-transparent text-muted-foreground/70 border border-dashed border-border',
}

export function CompatBadge({ status }: { status: CompatibilityStatus }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_STYLES[status]}`}
    >
      {t(`compat.status.${status}`)}
    </span>
  )
}
