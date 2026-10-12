import { formatBytes } from '../styles.js'
import { LayerChain } from './LayerChip.jsx'

export default function CompareTable({ data }) {
  const max = Math.max(data.originalBytes, ...data.rows.map((r) => r.storedBytes))
  const best = Math.min(...data.rows.map((r) => r.storedBytes))

  return (
    <ul className="space-y-3">
      {data.rows.map((row, i) => {
        const tone = row.storedBytes === best ? 'bg-emerald-400' : row.storedBytes > data.originalBytes ? 'bg-rose-400' : 'bg-indigo-400'
        return (
          <li key={i}>
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <LayerChain layers={row.layers} />
              <span className="text-sm tabular-nums text-slate-700">
                {formatBytes(row.storedBytes)} <span className="text-slate-400">· {row.percentOfOriginal}%</span>
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${tone}`} style={{ width: `${(row.storedBytes / max) * 100}%` }} />
              {/* Marks the original size, so anything past it grew instead of shrinking. */}
              <div className="absolute -top-1 h-4 w-px bg-slate-500" style={{ left: `${(data.originalBytes / max) * 100}%` }} />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
