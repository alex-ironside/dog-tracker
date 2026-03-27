import { useMemo, useState, useEffect, useRef } from 'react'
import { ForceGraph2D } from 'react-force-graph'
import { useAppStore } from '@/store'
import type { Dog, CompatibilityEntry, CompatibilityStatus } from '@/types'

type GraphNode = { id: string; name: string }
type GraphLink = { source: string; target: string; status: CompatibilityStatus }

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
  const dogs = useAppStore((s) => s.dogs)
  const compatibilityEntries = useAppStore((s) => s.compatibilityEntries)

  const graphData = useMemo(
    () => buildGraphData(dogs, compatibilityEntries),
    [dogs, compatibilityEntries]
  )

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
        linkLineDash={(link) => (link as GraphLink).status === 'unknown' ? [5, 5] : []}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = (node as GraphNode).name
          const fontSize = 14 / globalScale
          ctx.font = `${fontSize}px sans-serif`
          ctx.fillStyle = '#1e293b'
          ctx.textAlign = 'center'
          ctx.fillText(label, node.x ?? 0, (node.y ?? 0) + 8 / globalScale)
        }}
        nodeCanvasObjectMode={() => 'after'}
        onLinkClick={() => { /* Plan 02 will add EdgeSheet handler */ }}
        onNodeClick={() => { /* Plan 02 will add DogPanel handler */ }}
      />
    </div>
  )
}
