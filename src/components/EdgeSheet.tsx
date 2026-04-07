import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { CompatBadge } from '@/components/CompatBadge'
import type { CompatibilityStatus } from '@/types'

type EdgeSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  dogNameA: string
  dogNameB: string
  currentStatus: CompatibilityStatus
  onSetStatus: (status: CompatibilityStatus) => void
  onRemove: () => void
}

const STATUS_OPTIONS: { value: CompatibilityStatus; label: string }[] = [
  { value: 'compatible', label: 'Compatible' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'conflict', label: 'Conflict' },
  { value: 'unknown', label: 'Unknown' },
]

export function EdgeSheet({
  open,
  onOpenChange,
  dogNameA,
  dogNameB,
  currentStatus,
  onSetStatus,
  onRemove,
}: EdgeSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<CompatibilityStatus | null>(null)

  // Reset selection when sheet opens
  useEffect(() => {
    if (open) {
      setSelectedStatus(null)
    }
  }, [open])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md p-0 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <SheetTitle className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {dogNameA} & {dogNameB}
          </SheetTitle>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close panel"
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Current status */}
          <p className="text-sm font-semibold text-foreground/90">Current status:</p>
          <div className="mt-1">
            <CompatBadge status={currentStatus} />
          </div>

          {/* Status picker */}
          <p className="text-sm font-semibold text-foreground/90 mt-6">Set compatibility:</p>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <Button
                key={value}
                variant="outline"
                aria-pressed={selectedStatus === value}
                className={
                  selectedStatus === value
                    ? 'ring-2 ring-offset-1 ring-primary'
                    : ''
                }
                onClick={() => setSelectedStatus(value)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-border mt-6 pt-4">
            <Button
              variant="ghost"
              className="text-destructive w-full justify-start"
              onClick={onRemove}
            >
              Remove relationship
            </Button>
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 bg-card border-t border-border py-4 px-6 flex justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Discard changes
          </Button>
          <Button
            variant="default"
            disabled={selectedStatus === null}
            onClick={() => {
              if (selectedStatus) onSetStatus(selectedStatus)
            }}
          >
            Set compatibility
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
