async function request(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const text = await res.text()
  let body = text
  try { body = text ? JSON.parse(text) : null } catch { /* plain-text error */ }
  if (!res.ok) {
    const message = typeof body === 'string' ? body : body?.detail ?? body?.title ?? `Request failed (${res.status})`
    const error = new Error(message)
    error.status = res.status
    error.body = body
    throw error
  }
  return body
}

const post = (path, body) => request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined })
const del = (path) => request(path, { method: 'DELETE' })
const enc = encodeURIComponent

export const getLayers = () => request('/api/layers')
export const listDocuments = () => request('/api/documents')
export const saveDocument = (doc) => post('/api/documents', doc)
export const readRaw = (id) => request(`/api/documents/${enc(id)}/raw`)
export const corruptDocument = (id) => post(`/api/documents/${enc(id)}/corrupt`)
export const deleteDocument = (id) => del(`/api/documents/${enc(id)}`)
export const compareStacks = (content) => post('/api/documents/compare', { content, stacks: [] })
export const getAudit = () => request('/api/audit')
export const clearAudit = () => del('/api/audit')

// 422 means a layer found the stored bytes corrupted. That's a result to show, not a failure of the page.
export const readDocument = (id) =>
  request(`/api/documents/${enc(id)}`).catch((err) => {
    if (err.status === 422) return { id, corrupted: true, title: err.body.title, detail: err.body.detail }
    throw err
  })
