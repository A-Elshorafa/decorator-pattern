import { btnCls, cardCls, formatBytes } from '../styles.js'
import CompareTable from './CompareTable.jsx'
import { LayerChain } from './LayerChip.jsx'
import TraceFlow from './TraceFlow.jsx'

function RawView({ data }) {
  return (
    <>
      <div className="mb-1 text-xs text-slate-500">
        First bytes as text (unprintable bytes shown as ·). Readable only if nothing compressed or encrypted it.
      </div>
      <pre className="whitespace-pre-wrap break-all rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100">{data.preview}</pre>
      <details className="mt-2 text-xs text-slate-500">
        <summary className="cursor-pointer">Base64 ({formatBytes(data.bytes)})</summary>
        <pre className="mt-1 whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-2 font-mono ring-1 ring-slate-200">{data.base64}</pre>
      </details>
    </>
  )
}

function Header({ title, subtitle, tone = 'text-slate-800', children }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className={`font-semibold ${tone}`}>{title}</h2>
        {subtitle && <div className="mt-0.5 text-xs text-slate-500">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export default function ResultPanel({ result, onRead, busy }) {
  if (!result) {
    return (
      <section className={cardCls + ' flex items-center justify-center text-sm text-slate-500'}>
        Save a document to see what each decorator does to it.
      </section>
    )
  }

  const { kind, data } = result

  return (
    <section className={cardCls + ' self-start'}>
      {kind === 'save' && (
        <>
          <Header title={`Saved ${data.id}`} subtitle={<LayerChain layers={data.layers} />}>
            <button className={btnCls + ' self-start'} disabled={busy} onClick={() => onRead(data.id)}>Read it back</button>
          </Header>
          <p className="mb-3 text-xs text-slate-500">Save runs the layers top to bottom: each one changes the bytes and passes them to the next.</p>
          <TraceFlow steps={data.trace} from="Your text" to="Stored" highlight />
        </>
      )}

      {kind === 'read' && data.corrupted && (
        <>
          <Header title={`${data.id} could not be read`} tone="text-rose-700" />
          <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
            <div className="font-medium">{data.title}</div>
            <div>{data.detail}</div>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            On read, the layer nearest the storage runs first, so it's the one that notices. A document with no layers would have returned the changed text without any error.
          </p>
        </>
      )}

      {kind === 'read' && !data.corrupted && (
        <>
          <Header title={`Read ${data.id}`} subtitle={<LayerChain layers={data.layers} />} />
          <p className="mb-3 text-xs text-slate-500">Read runs the same layers bottom to top, so each one undoes its own change.</p>
          <TraceFlow steps={data.trace} from="Stored" to="Your text" />
          <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-3 font-sans text-sm text-slate-800 ring-1 ring-slate-200">{data.content}</pre>
        </>
      )}

      {kind === 'raw' && (
        <>
          <Header title={`Raw bytes of ${data.id}`} subtitle={`${formatBytes(data.bytes)}, read from storage with no decorators`} />
          <RawView data={data} />
        </>
      )}

      {kind === 'corrupt' && (
        <>
          <Header title={`Flipped one byte in ${data.id}`} tone="text-amber-700" subtitle="Read it to see which layer catches the change.">
            <button className={btnCls + ' self-start'} disabled={busy} onClick={() => onRead(data.id)}>Read it now</button>
          </Header>
          <RawView data={data} />
        </>
      )}

      {kind === 'compare' && (
        <>
          <Header title="Stored size by stack" subtitle={`Original: ${formatBytes(data.originalBytes)} (the line on each bar)`} />
          <CompareTable data={data} />
          <p className="mt-4 text-xs text-slate-500">
            Encrypted bytes look random, so compressing after encrypting can't shrink them and only adds GZip's overhead.
            Compress first, then encrypt.
          </p>
        </>
      )}
    </section>
  )
}
