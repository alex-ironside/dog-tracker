import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '@/store'
import type { WalkOutcome } from '@/types'

type WalkHistoryChartProps = {
  dogId: string
}

const OUTCOME_Y: Record<WalkOutcome, number> = {
  great: 5,
  good: 4,
  neutral: 3,
  poor: 2,
  incident: 1,
}

const OUTCOME_LABEL: Record<number, string> = {
  5: 'Great',
  4: 'Good',
  3: 'Neutral',
  2: 'Poor',
  1: 'Incident',
}

const OUTCOME_COLORS: Record<WalkOutcome, string> = {
  great: '#22c55e',
  good: '#14b8a6',
  neutral: '#94a3b8',
  poor: '#f59e0b',
  incident: '#ef4444',
}

function OutcomeDot(props: any) {
  const { cx, cy, payload } = props
  const color = OUTCOME_COLORS[payload.outcome as WalkOutcome] ?? '#94a3b8'
  return <circle cx={cx} cy={cy} r={6} fill={color} stroke="white" strokeWidth={1} />
}

function WalkHistoryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-card border border-border rounded px-3 py-2 shadow-sm text-sm">
      <p className="font-semibold">{data.date}</p>
      <p>{OUTCOME_LABEL[data.y]}</p>
      {data.notes && <p className="text-muted-foreground line-clamp-2">{data.notes}</p>}
    </div>
  )
}

export function WalkHistoryChart({ dogId }: WalkHistoryChartProps) {
  const { t } = useTranslation()
  const walkHistory = useAppStore((s) => s.walkHistory)
  const dogs = useAppStore((s) => s.dogs)

  const dog = dogs.find((d) => d.id === dogId)
  const dogName = dog?.name ?? 'Unknown'

  const entries = walkHistory.filter((e) => e.dogIds.includes(dogId))

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm text-muted-foreground/70">
        {t('history.empty', { defaultValue: 'No walks logged yet' })}
      </div>
    )
  }

  const chartData = entries.map((e) => ({
    x: new Date(e.date).getTime(),
    y: OUTCOME_Y[e.outcome],
    outcome: e.outcome,
    notes: e.notes,
    date: e.date,
  }))

  return (
    <div aria-label={`Walk outcome history for ${dogName}`}>
      <ResponsiveContainer width="100%" height={220}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="x"
            type="number"
            domain={['auto', 'auto']}
            tickFormatter={(ms: number) =>
              new Date(ms).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
            }
            name="Date"
          />
          <YAxis
            dataKey="y"
            type="number"
            domain={[0, 6]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(v: number) => OUTCOME_LABEL[v] ?? ''}
            width={60}
          />
          <Tooltip content={<WalkHistoryTooltip />} />
          <Scatter data={chartData} shape={<OutcomeDot />} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
