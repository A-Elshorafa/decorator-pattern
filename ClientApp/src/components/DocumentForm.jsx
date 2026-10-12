import { useState } from 'react'
import { btnCls, cardCls, ghostCls, inputCls, nesting, smallBtnCls } from '../styles.js'
import LayerChip from './LayerChip.jsx'

const SAMPLE = Array(8).fill('This agreement is made between Nile Logistics and Delta Retail.').join(' ')

const PRESETS = {
  Recommended: ['Audit', 'Compression', 'Encryption', 'Checksum'],
  'Wrong order': ['Encryption', 'Compression'],
  Plain: [],
}

export default function DocumentForm({ layers, onSave, onCompare, busy }) {
  const [id, setId] = useState('contract-001')
  const [content, setContent] = useState(SAMPLE)
  const [stack, setStack] = useState(PRESETS.Recommended)

  const describe = Object.fromEntries(layers.map((l) => [l.layer, l.description]))
  const move = (i, by) => {
    const next = [...stack]
    ;[next[i], next[i + by]] = [next[i + by], next[i]]
    setStack(next)
  }
  const remove = (i) => setStack(stack.filter((_, j) => j !== i))

  const submit = (e) => {
    e.preventDefault()
    onSave({ id: id.trim() || null, content, layers: stack })
  }

  return (
    <form className={cardCls} onSubmit={submit}>
      <h2 className="mb-3 font-semibold text-slate-800">Save a document</h2>

      <label className="block text-sm font-medium text-slate-700">
        Id <span className="font-normal text-slate-400">(empty = generated, existing = overwritten)</span>
        <input className={inputCls + ' mt-1 font-normal'} value={id} onChange={(e) => setId(e.target.value)} placeholder="contract-001" />
      </label>

      <label className="mt-3 block text-sm font-medium text-slate-700">
        Content <span className="font-normal text-slate-400">({new TextEncoder().encode(content).length} bytes)</span>
        <textarea className={inputCls + ' mt-1 h-28 font-normal'} value={content} onChange={(e) => setContent(e.target.value)} required />
      </label>

      <div className="mt-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-medium text-slate-700">Decorator stack</span>
          <div className="flex flex-wrap gap-1">
            {Object.entries(PRESETS).map(([name, preset]) => (
              <button key={name} type="button" className={smallBtnCls} onClick={() => setStack(preset)}>{name}</button>
            ))}
          </div>
        </div>

        {stack.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500 ring-1 ring-slate-200">
            No layers: the bytes go straight to storage as plain text.
          </p>
        ) : (
          <ol className="space-y-1.5">
            {stack.map((layer, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 p-2 ring-1 ring-slate-200">
                <span className="mt-0.5 w-4 text-right text-xs text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <LayerChip layer={layer} />
                  <p className="mt-1 text-xs text-slate-500">{describe[layer]}</p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" className={smallBtnCls} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
                  <button type="button" className={smallBtnCls} disabled={i === stack.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
                  <button type="button" className={smallBtnCls} onClick={() => remove(i)} aria-label="Remove">✕</button>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="mt-2 flex flex-wrap gap-1">
          {layers.map((l) => (
            <button key={l.layer} type="button" className="text-sm font-medium text-indigo-600 hover:text-indigo-800 mr-3"
              onClick={() => setStack([...stack, l.layer])}>
              + {l.layer}
            </button>
          ))}
        </div>

        <code className="mt-2 block break-all rounded-lg bg-slate-900 px-3 py-2 text-xs text-slate-100">{nesting(stack)}</code>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button className={btnCls + ' flex-1'} disabled={busy}>Save</button>
        <button type="button" className={ghostCls + ' flex-1'} disabled={busy || !content} onClick={() => onCompare(content)}>
          Compare stack sizes
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        “Compare” saves this content through several stacks into throwaway storage, including both orders of compression and encryption.
      </p>
    </form>
  )
}
