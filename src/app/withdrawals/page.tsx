'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { CheckCircle2, XCircle, Search, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type Withdrawal = {
  id: string
  amount: number
  upi_id: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_id: string
  users: { name: string | null; mobile: string | null; email: string | null; wallet_balance: number } | null
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected'

export default function AdminWithdrawalsPage() {
  const [data, setData] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/withdrawals', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.data) setData(json.data)
    else toast.error(json.error || 'Failed to load')
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const filtered = data.filter(w => {
    if (filter !== 'all' && w.status !== filter) return false
    const q = search.toLowerCase()
    const name = (w.users?.name || w.users?.email || '').toLowerCase()
    const upi = w.upi_id.toLowerCase()
    return !search || name.includes(q) || upi.includes(q)
  })

  const act = async (id: string, status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !confirm('Reject this withdrawal? Amount will be refunded to wallet.')) return
    setProcessing(id)
    const res = await fetch(`/api/admin/withdrawals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    setProcessing(null)
    if (json.error) { toast.error(json.error); return }
    toast.success(status === 'approved' ? 'Withdrawal approved!' : 'Withdrawal rejected, amount refunded.')
    setData(d => d.map(w => w.id === id ? { ...w, status } : w))
  }

  const pending = data.filter(w => w.status === 'pending')
  const pendingTotal = pending.reduce((s, w) => s + w.amount, 0)
  const approved = data.filter(w => w.status === 'approved')
  const approvedTotal = approved.reduce((s, w) => s + w.amount, 0)

  const displayName = (w: Withdrawal) => w.users?.name || w.users?.email || w.users?.mobile || 'Unknown'

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Withdrawals</h1>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Pending', value: pending.length, sub: `₹${pendingTotal} to pay`, color: 'text-amber-600' },
              { label: 'Approved', value: approved.length, sub: `₹${approvedTotal} paid`, color: 'text-green-600' },
              { label: 'Rejected', value: data.filter(w => w.status === 'rejected').length, sub: 'refunded', color: 'text-red-500' },
              { label: 'Total', value: data.length, sub: 'all time', color: 'text-brand-600' },
            ].map(s => (
              <div key={s.label} className="card p-4">
                <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                <p className={`font-bold text-2xl ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="input pl-8 w-48" />
            </div>
            {(['all', 'pending', 'approved', 'rejected'] as StatusFilter[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border capitalize transition-all ${filter === f ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : data.length === 0 ? (
            <div className="text-center py-20">
              <Wallet size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No withdrawal requests yet.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Student', 'UPI ID', 'Amount', 'Wallet Balance', 'Date', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(w => (
                      <tr key={w.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{displayName(w)}</p>
                          <p className="text-xs text-gray-400">{w.users?.mobile || w.users?.email || '—'}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-600">{w.upi_id}</td>
                        <td className="px-4 py-3 font-bold text-gray-900">₹{w.amount}</td>
                        <td className="px-4 py-3 text-gray-600">₹{(w.users?.wallet_balance || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(w.created_at), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            w.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            w.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-red-50 text-red-600 border-red-200'
                          }`}>{w.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          {w.status === 'pending' && (
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => act(w.id, 'approved')}
                                disabled={processing === w.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 disabled:opacity-50"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                              <button
                                onClick={() => act(w.id, 'rejected')}
                                disabled={processing === w.id}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 disabled:opacity-50"
                              >
                                <XCircle size={12} /> Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
