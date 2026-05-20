'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Search, Ban, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type User = {
  id: string
  name: string | null
  mobile: string | null
  email: string | null
  wallet_balance: number
  is_blocked: boolean
  created_at: string
  purchase_count: number
  referral_count: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.data) setUsers(json.data)
    else toast.error(json.error || 'Failed to load users')
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.mobile || '').includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    )
  })

  const toggleBlock = async (u: User) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id: u.id, is_blocked: !u.is_blocked }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success(u.is_blocked ? 'User unblocked' : 'User blocked')
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x))
  }

  const displayName = (u: User) => u.name || u.email?.split('@')[0] || u.mobile || 'Unknown'

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Users</h1>
        </div>
        <div className="p-6">
          <div className="relative mb-5 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, phone, email..." className="input pl-8" />
          </div>

          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Users', value: users.length },
              { label: 'Active', value: users.filter(u => !u.is_blocked).length },
              { label: 'Blocked', value: users.filter(u => u.is_blocked).length },
              { label: 'With Purchases', value: users.filter(u => u.purchase_count > 0).length },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <p className="font-bold text-2xl text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-20">
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No users yet. They will appear here after sign up.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['User', 'Contact', 'Purchases', 'Wallet', 'Referrals', 'Joined', 'Status', 'Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50 transition-colors ${u.is_blocked ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {displayName(u)[0]?.toUpperCase() || '?'}
                            </div>
                            <p className="font-medium text-gray-800">{displayName(u)}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-gray-600">{u.email || '—'}</p>
                          <p className="text-xs text-gray-400">{u.mobile || '—'}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{u.purchase_count}</td>
                        <td className="px-4 py-3 font-semibold text-green-600">₹{(u.wallet_balance || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">{u.referral_count}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{format(new Date(u.created_at), 'dd MMM yyyy')}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${u.is_blocked ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                            {u.is_blocked ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleBlock(u)}
                            className={`p-1.5 rounded-lg ${u.is_blocked ? 'hover:bg-green-50 text-green-500' : 'hover:bg-red-50 text-red-500'}`}
                            title={u.is_blocked ? 'Unblock' : 'Block'}
                          >
                            <Ban size={14} />
                          </button>
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
