import { useEffect, useState } from 'react'
import {
  clearAudit, compareStacks, corruptDocument, deleteDocument, getAudit, getLayers, listDocuments, readDocument, readRaw, saveDocument,
} from './api.js'
import AuditLog from './components/AuditLog.jsx'
import DocumentForm from './components/DocumentForm.jsx'
import DocumentList from './components/DocumentList.jsx'
import ResultPanel from './components/ResultPanel.jsx'

export default function App() {
  const [layers, setLayers] = useState([])
  const [documents, setDocuments] = useState([])
  const [audit, setAudit] = useState([])
  const [result, setResult] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = async () => {
    const [docs, entries] = await Promise.all([listDocuments(), getAudit()])
    setDocuments(docs)
    setAudit(entries)
  }

  // Runs one action, shows its error if any, then refreshes the document list and audit log.
  const run = async (action) => {
    setBusy(true)
    setError('')
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      await refresh().catch(() => {})
      setBusy(false)
    }
  }

  useEffect(() => {
    run(async () => setLayers(await getLayers()))
  }, [])

  const actions = {
    save: (doc) => run(async () => setResult({ kind: 'save', data: await saveDocument(doc) })),
    compare: (content) => run(async () => setResult({ kind: 'compare', data: await compareStacks(content) })),
    read: (id) => run(async () => setResult({ kind: 'read', data: await readDocument(id) })),
    raw: (id) => run(async () => setResult({ kind: 'raw', data: await readRaw(id) })),
    corrupt: (id) => run(async () => setResult({ kind: 'corrupt', data: await corruptDocument(id) })),
    remove: (id) =>
      run(async () => {
        await deleteDocument(id)
        setResult((r) => (r?.data?.id === id ? null : r))
      }),
    clearAudit: () => run(clearAudit),
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Storage Decorator</h1>
        <p className="text-sm text-slate-600">
          The storage only keeps bytes. Compression, encryption, a checksum and audit logging are decorators with the same
          interface, stacked in the order you choose. Save runs them top to bottom; read runs them bottom to top.
        </p>
      </header>

      {error && (
        <div className="flex items-start justify-between gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 ring-1 ring-rose-200">
          <span>{error}</span>
          <button className="font-medium" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <DocumentForm layers={layers} onSave={actions.save} onCompare={actions.compare} busy={busy} />
        <ResultPanel result={result} onRead={actions.read} busy={busy} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <DocumentList documents={documents} actions={actions} busy={busy} />
        <AuditLog entries={audit} onClear={actions.clearAudit} busy={busy} />
      </div>
    </div>
  )
}
