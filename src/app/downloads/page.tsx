'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Search, AlertTriangle, Download } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

type DownloadLog = {
  id: string
  created_at: string
  watermark_id: string | null
  ip_address: string | null
  device_info: string | null
  users: { name: string | null; mobile: string | null; email: string | null } | null
  papers: { title_en: string } | null
}

export default function AdminDownloadsPage() {
  const [logs, setLogs] = useState<DownloadLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [trackId, setTrackId] = useState('')
  const [found, setFound] = useState<DownloadLog | null>(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/downloads', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setLogs(json.data || [])
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const displayName = (l: DownloadLog) => l.users?.name || l.users?.email || l.users?.mobile || 'Unknown'

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    return (
      displayName(l).toLowerCase().includes(q) ||
      (l.papers?.title_en || '').toLowerCase().includes(q) ||
      (l.watermark_id || '').toLowerCase().includes(q)
    )
  })

  const trackLeak = () => {
    const result = logs.find(l => l.watermark_id?.toUpperCase() === trackId.toUpperCase())
    setFound(result || null)
    if (!result) toast.error('No record found for this watermark ID')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Downloads & Leak Tracking</h1>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <h2 className="font-semibold text-amber-800">Leak Tracker</h2>
            </div>
            <p className="text-sm text-amber-700 mb-4">
              If a PDF leaks publicly, find the hidden watermark ID and enter it below to identify the source account.
            </p>
            <div className="flex gap-3">
              <input
                value={trackId}
                onChange={e => setTrackId(e.target.value.toUpperCase())}
                placeholder="UID-X82K9P"
                className="input flex-1 font-mono bg-white"
              />
              <button onClick={trackLeak} className="btn-primary px-5">Track</button>
            </div>
            {found && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm font-bold text-red-700 mb-2">⚠️ Leak Source Identified!</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-red-700">
                  <div><span className="font-semibold">User:</span> {displayName(found)}</div>
                  <div><span className="font-semibold">Paper:</span> {found.papers?.title_en || '—'}</div>
                  <div><span className="font-semibold">IP:</span> {found.ip_address || '—'}</div>
                  <div><span className="font-semibold">Device:</span> {found.device_info || '—'}</div>
                  <div><span className="font-semibold">Date:</span> {format(new Date(found.created_at), 'dd MMM yyyy HH:mm')}</div>
                  <div><span className="font-semibold">Watermark:</span> {found.watermark_id}</div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Download Log</h2>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-8 w-48" />
              </div>
            </div>
            {loading ? (
              <div className="text-center py-10 text-gray-400">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-10">
                <Download size={32} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No downloads logged yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['User', 'Paper', 'Watermark ID', 'IP Address', 'Device', 'Date'].map(h => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(l => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{displayName(l)}</td>
                        <td className="px-4 py-3 text-gray-600">{l.papers?.title_en || '—'}</td>
                        <td className="px-4 py-3">
                          <code className="font-mono text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                            {l.watermark_id || '—'}
                          </code>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{l.ip_address || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{l.device_info || '—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{format(new Date(l.created_at), 'dd MMM yyyy HH:mm')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
