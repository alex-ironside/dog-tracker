type ConflictLine = {
  x1: number
  y1: number
  x2: number
  y2: number
  idA: string
  idB: string
}

export type { ConflictLine }

type ConflictOverlayProps = {
  conflicts: Array<{ idA: string; idB: string; status: 'conflict' | 'unknown' }>
  cardRefs: React.RefObject<Map<string, HTMLElement>>
  containerRef: React.RefObject<HTMLDivElement>
  onConflictClick: (idA: string, idB: string) => void
}

/**
 * Compute SVG line coordinates from DOM element positions.
 * Called from GroupPanel's useLayoutEffect (where containerRef is guaranteed to be set).
 */
export function computeConflictLines(
  conflicts: ConflictOverlayProps['conflicts'],
  cardRefs: React.RefObject<Map<string, HTMLElement>>,
  containerRef: React.RefObject<HTMLDivElement>
): ConflictLine[] {
  if (!containerRef.current || !cardRefs.current) return []

  const containerRect = containerRef.current.getBoundingClientRect()

  return conflicts
    .filter((c) => c.status === 'conflict') // D-04: only 'conflict' triggers a line, not unknown
    .map((c) => {
      const refA = cardRefs.current!.get(c.idA)
      const refB = cardRefs.current!.get(c.idB)
      if (!refA || !refB) return null

      const rA = refA.getBoundingClientRect()
      const rB = refB.getBoundingClientRect()

      return {
        x1: rA.left + rA.width / 2 - containerRect.left,
        y1: rA.top + rA.height / 2 - containerRect.top,
        x2: rB.left + rB.width / 2 - containerRect.left,
        y2: rB.top + rB.height / 2 - containerRect.top,
        idA: c.idA,
        idB: c.idB,
      }
    })
    .filter((l): l is ConflictLine => l !== null)
}

type ConflictOverlayRenderProps = {
  lines: ConflictLine[]
  onConflictClick: (idA: string, idB: string) => void
}

/**
 * Pure render component — receives pre-computed line coordinates.
 * This avoids the ref timing issue where useLayoutEffect in a child fires before
 * the parent's containerRef is set.
 */
export function ConflictOverlay({ lines, onConflictClick }: ConflictOverlayRenderProps) {
  return (
    <svg className='absolute inset-0 w-full h-full pointer-events-none' style={{ zIndex: 10 }}>
      {lines.map((l) => (
        <line
          key={`${l.idA}-${l.idB}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke='#ef4444'
          strokeWidth={1.5}
          opacity={0.7}
          style={{ pointerEvents: 'all', cursor: 'pointer' }}
          onClick={() => onConflictClick(l.idA, l.idB)}
        />
      ))}
    </svg>
  )
}

// Re-export conflicts prop type for GroupPanel usage
export type { ConflictOverlayProps }
