import { LAYER_TONES } from '../styles.js'

export default function LayerChip({ layer }) {
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${LAYER_TONES[layer]}`}>{layer}</span>
}

// A stack as chips joined by arrows, or "no layers" for plain storage.
export function LayerChain({ layers }) {
  if (layers.length === 0) return <span className="text-xs italic text-slate-400">no layers</span>
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {layers.map((l, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-xs text-slate-400">→</span>}
          <LayerChip layer={l} />
        </span>
      ))}
    </span>
  )
}
