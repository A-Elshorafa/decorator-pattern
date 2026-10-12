import { cardCls, formatBytes, smallBtnCls } from '../styles.js'
import { LayerChain } from './LayerChip.jsx'

export default function DocumentList({ documents, actions, busy }) {
  return (
    <section className={cardCls}>
      <h2 className="mb-2 font-semibold text-slate-800">Documents</h2>
      {documents.length === 0 ? (
        <p className="text-sm text-slate-500">Nothing saved yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {documents.map((d) => (
            <li key={d.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="break-all font-medium text-slate-800">{d.id}</span>
                  <span className="text-xs tabular-nums text-slate-500">
                    {formatBytes(d.originalBytes)} → {formatBytes(d.storedBytes)} stored
                  </span>
                </div>
                <LayerChain layers={d.layers} />
              </div>
              <div className="flex shrink-0 gap-1">
                <button className={smallBtnCls} disabled={busy} onClick={() => actions.read(d.id)}>Read</button>
                <button className={smallBtnCls} disabled={busy} onClick={() => actions.raw(d.id)}>Raw</button>
                <button className={smallBtnCls + ' text-amber-700'} disabled={busy} onClick={() => actions.corrupt(d.id)}>Corrupt</button>
                <button className={smallBtnCls + ' text-rose-600'} disabled={busy} onClick={() => actions.remove(d.id)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
