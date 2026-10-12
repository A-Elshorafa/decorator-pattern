import { cardCls, formatBytes, smallBtnCls } from '../styles.js'

export default function AuditLog({ entries, onClear, busy }) {
  return (
    <section className={cardCls}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">Audit log</h2>
        <button className={smallBtnCls} disabled={busy || entries.length === 0} onClick={onClear}>Clear</button>
      </div>
      <p className="mb-2 text-xs text-slate-500">
        Written by the Audit decorator only, so documents saved without it don't show up. The size is what Audit sees at its place in the stack.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing yet.</p>
      ) : (
        <ul className="max-h-80 divide-y divide-slate-100 overflow-auto text-sm">
          {entries.map((e, i) => (
            <li key={i} className="py-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-slate-700">
                  <span className="mr-2 text-xs text-slate-400">{new Date(e.at).toLocaleTimeString()}</span>
                  <span className="mr-1 font-medium">{e.operation}</span>{e.documentId}
                </span>
                <span className="shrink-0 tabular-nums text-xs text-slate-500">
                  {formatBytes(e.bytes)} · {e.elapsedMs.toFixed(1)} ms
                </span>
              </div>
              {e.error && <div className="text-xs text-rose-600">{e.error}</div>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
