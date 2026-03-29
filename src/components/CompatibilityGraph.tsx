import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { useAppStore } from '@/store'
import { EdgeSheet } from '@/components/EdgeSheet'
import { DogPanel } from '@/components/DogPanel'
import { pairKey, inferStatusFromHistory, inferGroupContextConflicts } from '@/lib/scoring'
import type { Dog, CompatibilityEntry, CompatibilityStatus } from '@/types'

type GraphNode = { id: string; name: string; isGroupNode?: boolean }
type GraphLink = { source: string; target: string; status: CompatibilityStatus; fromHistory?: boolean; isGroupEdge?: boolean; isGroupTarget?: boolean }

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

    // Hyperedge nodes for group-context conflicts
    const groupConflicts = inferGroupContextConflicts(walkHistory)
    const groupNodes: GraphNode[] = []
    const groupLinks: GraphLink[] = []

    for (const { triggerIds, targetId } of groupConflicts) {
      const groupNodeId = 'group_' + triggerIds.join('|')
      const triggerNames = triggerIds
        .map((id) => allDogs.find((d) => d.id === id)?.name ?? id)
        .join(', ')
      // Avoid duplicate group nodes
      if (!groupNodes.find((n) => n.id === groupNodeId)) {
        groupNodes.push({ id: groupNodeId, name: triggerNames, isGroupNode: true })
      }
      // Links from each trigger dog to the group node (thin, dashed, gray)
      for (const triggerId of triggerIds) {
        groupLinks.push({
          source: triggerId,
          target: groupNodeId,
          status: 'unknown',
          isGroupEdge: true,
        })
      }
      // Link from group node to target dog (thick, red)
      groupLinks.push({
        source: groupNodeId,
        target: targetId,
        status: 'conflict',
        isGroupTarget: true,
      })
    }

    return {
      nodes: [...base.nodes, ...groupNodes],
      links: [...base.links, ...historyLinks, ...groupLinks],
    }
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
      // Group nodes are synthetic — clicking is a no-op
      if (n.isGroupNode) return
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
        d3VelocityDecay={0.4}
        cooldownTicks={100}
        linkColor={(link) => {
          const l = link as GraphLink
          if (l.isGroupEdge) return '#94a3b8'
          if (l.isGroupTarget) return '#ef4444'
          return STATUS_COLOR[l.status]
        }}
        linkWidth={(link) => {
          const l = link as GraphLink
          if (l.isGroupEdge) return 1
          if (l.isGroupTarget) return 3
          return l.status === 'conflict' ? 3 : 2
        }}
        linkLineDash={(link) => {
          const l = link as GraphLink
          if (l.isGroupEdge) return [4, 4]
          if (l.fromHistory) return [3, 3]
          return l.status === 'unknown' ? [5, 5] : []
        }}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const x = node.x ?? 0
          const y = node.y ?? 0
          const n = node as GraphNode

          if (n.isGroupNode) {
            // Draw diamond shape for group nodes
            const size = 5
            ctx.beginPath()
            ctx.moveTo(x, y - size)
            ctx.lineTo(x + size, y)
            ctx.lineTo(x, y + size)
            ctx.lineTo(x - size, y)
            ctx.closePath()
            ctx.fillStyle = '#f97316'
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5
            ctx.stroke()

            // Small label below diamond
            const label = n.name
            const fontSize = Math.max(8, 11 / globalScale)
            ctx.font = `${fontSize}px sans-serif`
            const textWidth = ctx.measureText(label).width
            const paddingH = 2
            const paddingV = 1
            const pillWidth = textWidth + paddingH * 2
            const pillHeight = fontSize + paddingV * 2
            const labelY = y + size + 3 / globalScale + fontSize / 2

            const pillX = x - pillWidth / 2
            const pillY = labelY - fontSize / 2 - paddingV
            ctx.globalAlpha = 0.7
            ctx.fillStyle = '#ffffff'
            const r = 2
            ctx.beginPath()
            ctx.moveTo(pillX + r, pillY)
            ctx.lineTo(pillX + pillWidth - r, pillY)
            ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + r)
            ctx.lineTo(pillX + pillWidth, pillY + pillHeight - r)
            ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - r, pillY + pillHeight)
            ctx.lineTo(pillX + r, pillY + pillHeight)
            ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - r)
            ctx.lineTo(pillX, pillY + r)
            ctx.quadraticCurveTo(pillX, pillY, pillX + r, pillY)
            ctx.closePath()
            ctx.fill()
            ctx.globalAlpha = 1

            ctx.fillStyle = '#ea580c'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText(label, x, labelY)
            return
          }

          const radius = 6

          // Draw node circle
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fillStyle = '#3b82f6'
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Draw label with background pill below circle
          const label = n.name
          const fontSize = Math.max(10, 14 / globalScale)
          ctx.font = `${fontSize}px sans-serif`
          const textWidth = ctx.measureText(label).width
          const paddingH = 2
          const paddingV = 1
          const pillWidth = textWidth + paddingH * 2
          const pillHeight = fontSize + paddingV * 2
          const labelY = y + radius + 4 / globalScale + fontSize / 2

          // Background pill
          const pillX = x - pillWidth / 2
          const pillY = labelY - fontSize / 2 - paddingV
          ctx.globalAlpha = 0.7
          ctx.fillStyle = '#ffffff'
          const r = 3
          ctx.beginPath()
          ctx.moveTo(pillX + r, pillY)
          ctx.lineTo(pillX + pillWidth - r, pillY)
          ctx.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + r)
          ctx.lineTo(pillX + pillWidth, pillY + pillHeight - r)
          ctx.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - r, pillY + pillHeight)
          ctx.lineTo(pillX + r, pillY + pillHeight)
          ctx.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - r)
          ctx.lineTo(pillX, pillY + r)
          ctx.quadraticCurveTo(pillX, pillY, pillX + r, pillY)
          ctx.closePath()
          ctx.fill()
          ctx.globalAlpha = 1

          // Label text
          ctx.fillStyle = '#1e293b'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, x, labelY)
        }}
        nodeCanvasObjectMode={() => 'replace'}
        nodePointerAreaPaint={(node, color, ctx) => {
          const x = node.x ?? 0
          const y = node.y ?? 0
          const n = node as GraphNode
          ctx.fillStyle = color
          if (n.isGroupNode) {
            const size = 5
            ctx.beginPath()
            ctx.moveTo(x, y - size)
            ctx.lineTo(x + size, y)
            ctx.lineTo(x, y + size)
            ctx.lineTo(x - size, y)
            ctx.closePath()
            ctx.fill()
          } else {
            ctx.beginPath()
            ctx.arc(x, y, 6, 0, Math.PI * 2)
            ctx.fill()
          }
        }}
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
