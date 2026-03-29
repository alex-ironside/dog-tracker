import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useAppStore } from '@/store'
import { EdgeSheet } from '@/components/EdgeSheet'
import { DogPanel } from '@/components/DogPanel'
import { pairKey, inferStatusFromHistory } from '@/lib/scoring'
import type { Dog, CompatibilityEntry, CompatibilityStatus } from '@/types'

type GraphNode = { id: string; name: string }
type GraphLink = { source: string; target: string; status: CompatibilityStatus; fromHistory?: boolean }

export function buildGraphData(dogs: Dog[], entries: CompatibilityEntry[]) {
  const nodes: GraphNode[] = dogs
    .filter((d) => !d.archived)
    .map((d) => ({ id: d.id, name: d.name }))

  const links: GraphLink[] = entries.map((e) => ({
    source: e.dogIdA,
    target: e.dogIdB,
    status: e.status,
  }))

  return { nodes, links }
}

const STATUS_COLOR: Record<CompatibilityStatus, string> = {
  compatible: '#22c55e',
  neutral: '#94a3b8',
  conflict: '#ef4444',
  unknown: '#cbd5e1',
}

export function CompatibilityGraph() {
  const allDogs = useAppStore((s) => s.dogs)
  const compatibilityEntries = useAppStore((s) => s.compatibilityEntries)
  const walkHistory = useAppStore((s) => s.walkHistory)

  const activeDogs = useMemo(() => allDogs.filter((d) => !d.archived), [allDogs])

  const graphData = useMemo(() => {
    const base = buildGraphData(allDogs, compatibilityEntries)
    const explicitPairs = new Set(
      compatibilityEntries.map((e) => pairKey(e.dogIdA, e.dogIdB))
    )
    const activeDogIds = allDogs.filter((d) => !d.archived).map((d) => d.id)
    const historyLinks: GraphLink[] = []
    for (let i = 0; i < activeDogIds.length; i++) {
      for (let j = i + 1; j < activeDogIds.length; j++) {
        const key = pairKey(activeDogIds[i], activeDogIds[j])
        if (!explicitPairs.has(key)) {
          const inferred = inferStatusFromHistory(activeDogIds[i], activeDogIds[j], walkHistory)
          if (inferred) {
            historyLinks.push({
              source: activeDogIds[i],
              target: activeDogIds[j],
              status: inferred,
              fromHistory: true,
            })
          }
        }
      }
    }
    return { nodes: base.nodes, links: [...base.links, ...historyLinks] }
  }, [allDogs, compatibilityEntries, walkHistory])

  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    })

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // EdgeSheet state
  const [edgeSheet, setEdgeSheet] = useState<{
    open: boolean
    idA: string
    idB: string
    nameA: string
    nameB: string
    status: CompatibilityStatus
  }>({ open: false, idA: '', idB: '', nameA: '', nameB: '', status: 'unknown' })

  // DogPanel state
  const [dogPanel, setDogPanel] = useState<{ open: boolean; dog: Dog | null }>({
    open: false,
    dog: null,
  })

  const handleLinkClick = useCallback(
    (link: unknown) => {
      const l = link as GraphLink & { source: unknown; target: unknown }
      const sourceId =
        typeof l.source === 'object' && l.source !== null
          ? (l.source as GraphNode).id
          : String(l.source)
      const targetId =
        typeof l.target === 'object' && l.target !== null
          ? (l.target as GraphNode).id
          : String(l.target)
      const nameA = activeDogs.find((d) => d.id === sourceId)?.name ?? ''
      const nameB = activeDogs.find((d) => d.id === targetId)?.name ?? ''
      setEdgeSheet({
        open: true,
        idA: sourceId,
        idB: targetId,
        nameA,
        nameB,
        status: l.status ?? 'unknown',
      })
    },
    [activeDogs]
  )

  const handleNodeClick = useCallback(
    (node: unknown) => {
      const n = node as GraphNode
      const dog = allDogs.find((d) => d.id === n.id) ?? null
      if (dog) setDogPanel({ open: true, dog })
    },
    [allDogs]
  )

  if (graphData.nodes.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-full py-16 text-center'>
        <h2 className='text-xl font-semibold text-slate-900 mb-2'>No compatibility data yet</h2>
        <p className='text-sm text-slate-500 max-w-xs'>
          Add dogs in the Dogs tab, then click any two dogs to set their compatibility.
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className='w-full flex-1' style={{ minHeight: '400px' }}>
      <ForceGraph2D
        graphData={graphData}
        width={dimensions.width}
        height={dimensions.height}
        nodeRelSize={6}
        d3VelocityDecay={0.4}
        cooldownTicks={100}
        linkColor={(link) => STATUS_COLOR[(link as GraphLink).status]}
        linkWidth={(link) => (link as GraphLink).status === 'conflict' ? 3 : 2}
        linkLineDash={(link) => {
          const l = link as GraphLink
          if (l.fromHistory) return [3, 3]
          return l.status === 'unknown' ? [5, 5] : []
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).name
          const fontSize = 14 / globalScale
          ctx.font = `${fontSize}px sans-serif`
          ctx.fillStyle = '#1e293b'
          ctx.textAlign = 'center'
          ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + 8 / globalScale)
        }}
        nodeCanvasObjectMode={() => 'after'}
        onLinkClick={handleLinkClick}
        onNodeClick={handleNodeClick}
      />

      <EdgeSheet
        open={edgeSheet.open}
        onOpenChange={(open) => setEdgeSheet((s) => ({ ...s, open }))}
        dogNameA={edgeSheet.nameA}
        dogNameB={edgeSheet.nameB}
        currentStatus={edgeSheet.status}
        onSetStatus={(status) => {
          useAppStore.getState().setCompatibility(edgeSheet.idA, edgeSheet.idB, status)
          setEdgeSheet((s) => ({ ...s, open: false }))
        }}
        onRemove={() => {
          useAppStore.getState().removeCompatibility(edgeSheet.idA, edgeSheet.idB)
          setEdgeSheet((s) => ({ ...s, open: false }))
        }}
      />

      <DogPanel
        open={dogPanel.open}
        onOpenChange={(open) => setDogPanel((s) => ({ ...s, open }))}
        editingDog={dogPanel.dog}
      />
    </div>
  )
}
