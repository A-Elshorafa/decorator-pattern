// No width here, so callers can size the field. inputCls is the usual full-width version.
export const fieldCls =
  'min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200'
export const inputCls = fieldCls + ' w-full'
export const btnCls =
  'rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50'
export const ghostCls =
  'rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
export const smallBtnCls =
  'rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50'
export const cardCls = 'rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200'

// One colour per decorator, used everywhere a layer is shown.
export const LAYER_TONES = {
  Compression: 'bg-sky-100 text-sky-800 ring-sky-200',
  Encryption: 'bg-violet-100 text-violet-800 ring-violet-200',
  Checksum: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  Audit: 'bg-amber-100 text-amber-800 ring-amber-200',
}
export const LAYER_BARS = {
  Compression: 'bg-sky-400',
  Encryption: 'bg-violet-400',
  Checksum: 'bg-emerald-400',
  Audit: 'bg-amber-400',
}

// "Audit(Compression(Checksum(Storage)))": how the factory nests the decorators.
export const nesting = (layers) => layers.reduceRight((inner, layer) => `${layer}(${inner})`, 'Storage')

export const formatBytes = (n) => (n == null ? '–' : `${n.toLocaleString()} B`)
