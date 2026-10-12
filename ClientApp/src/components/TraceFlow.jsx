import { LAYER_BARS, formatBytes } from '../styles.js'
import LayerChip from './LayerChip.jsx'

function Bar({ bytes, max, tone }) {
  return (
    <div className="h-2 flex-1 rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${tone}`} style={{ width: `${max ? Math.max(2, (bytes / max) * 100) : 0}%` }} />
    </div>
  )
}

function Change({ from, to, highlight }) {
  if (from === to) return <span className="text-slate-400">unchanged</span>
  const diff = to - from
  const tone = !highlight ? 'text-slate-500' : diff < 0 ? 'text-emerald-700' : 'text-rose-600'
  return <span className={tone}>{diff > 0 ? '+' : '−'}{Math.abs(diff)} B</span>
}

// What each decorator did to the size, from where the data starts to where it ends.
// highlight colours shrinking green and growing red. On save that's the cost of each layer; on read, growth is just undoing it.
export default function TraceFlow({ steps, from, to, highlight = false }) {
  if (steps.length === 0) return <p className="text-sm text-slate-500">No layers: the bytes were passed through as they are.</p>

  const start = steps[0].bytesIn
  const max = Math.max(start, ...steps.map((s) => s.bytesOut))

  return (
    <ol className="space-y-2 text-sm">
      <li className="flex items-center gap-3">
        <span className="w-28 shrink-0 text-xs font-medium text-slate-500">{from}</span>
        <Bar bytes={start} max={max} tone="bg-slate-400" />
        <span className="w-24 shrink-0 text-right tabular-nums text-slate-700">{formatBytes(start)}</span>
      </li>
      {steps.map((s, i) => (
        <li key={i} className="flex items-center gap-3">
          <span className="w-28 shrink-0"><LayerChip layer={s.layer} /></span>
          <Bar bytes={s.bytesOut} max={max} tone={LAYER_BARS[s.layer]} />
          <span className="w-24 shrink-0 text-right tabular-nums">
            <span className="text-slate-700">{formatBytes(s.bytesOut)}</span>
            <span className="block text-xs"><Change from={s.bytesIn} to={s.bytesOut} highlight={highlight} /></span>
          </span>
        </li>
      ))}
      <li className="flex items-center gap-3 border-t border-slate-100 pt-2">
        <span className="w-28 shrink-0 text-xs font-medium text-slate-500">{to}</span>
        <span className="flex-1" />
        <span className="w-24 shrink-0 text-right font-semibold tabular-nums text-slate-800">{formatBytes(steps.at(-1).bytesOut)}</span>
      </li>
    </ol>
  )
}
