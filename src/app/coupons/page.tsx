'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Plus, Trash2, X, Copy, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

type Coupon = {
  id: string
  code: string
  type: 'percentage' | 'flat'
  value: number
  use_count: number
  max_uses: number
  expiry_date: string
  is_active: boolean
}

const EMPTY_FORM = { code: '', type: 'percentage', value: '', max_uses: '', expiry_date: '' }

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/coupons', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.data) setCoupons(json.data)
    else toast.error(json.error || 'Failed to load coupons')
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    if (!form.code || !form.value || !form.expiry_date) { toast.error('Fill all fields'); return }
    setSaving(true)
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, value: Number(form.value), max_uses: Number(form.max_uses) || 999 }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success('Coupon created!')
    setModal(false)
    setForm(EMPTY_FORM)
    load()
  }

  const toggleActive = async (cp: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${cp.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !cp.is_active }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    setCoupons(c => c.map(x => x.id === cp.id ? { ...x, is_active: !x.is_active } : x))
    toast.success('Coupon updated')
  }

  const deleteCoupon = async (id: string) => {
    if (!confirm('Delete this coupon?')) return
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Coupon deleted')
    setCoupons(c => c.filter(x => x.id !== id))
  }

  const copyCoupon = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success(`Copied: ${code}`)
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Coupons</h1>
          <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Create Coupon
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-20">
              <Tag size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No coupons yet. Create one above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(cp => (
                <div key={cp.id} className={`card p-5 ${!cp.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-bold text-xl text-gray-900 tracking-wider">{cp.code}</code>
                      <button onClick={() => copyCoupon(cp.code)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                        <Copy size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => toggleActive(cp)}
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cp.is_active ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                    >
                      {cp.is_active ? 'Active' : 'Off'}
                    </button>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Discount</span>
                      <span className="font-semibold text-brand-600">
                        {cp.type === 'percentage' ? `${cp.value}%` : `₹${cp.value}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Used</span>
                      <span className="font-medium">{cp.use_count}/{cp.max_uses}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expires</span>
                      <span className="font-medium text-xs">{cp.expiry_date}</span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (cp.use_count / cp.max_uses) * 100)}%` }} />
                  </div>
                  <button onClick={() => deleteCoupon(cp.id)} className="mt-3 flex items-center gap-1 text-xs text-red-500 hover:underline">
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Create Coupon</h2>
              <button onClick={() => setModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Coupon Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input font-mono font-bold tracking-wider" placeholder="BOARD25" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Discount Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="input">
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="input" placeholder={form.type === 'percentage' ? '10' : '25'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Max Uses</label>
                  <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} className="input" placeholder="500" />
                </div>
                <div>
                  <label className="label">Expiry Date</label>
                  <input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
