'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Bell, Send, Users, User } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

type SentNotification = {
  id: string
  title: string
  body: string
  target: string
  reach: number
  created_at: string
}

export default function AdminNotificationsPage() {
  const [form, setForm] = useState({ title: '', body: '', target: 'all' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState<SentNotification[]>([])
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const loadSent = useCallback(async () => {
    const res = await fetch('/api/admin/notifications', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    setSent(json.data || [])
  }, [token])

  useEffect(() => { loadSent() }, [loadSent])

  const handleSend = async () => {
    if (!form.title || !form.body) { toast.error('Fill title and message'); return }
    setLoading(true)
    const res = await fetch('/api/admin/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    toast.success('Notification recorded!')
    setForm({ title: '', body: '', target: 'all' })
    loadSent()
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Notifications</h1>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
                <Bell size={15} className="text-brand-500" />
              </div>
              <h2 className="font-semibold text-gray-900">Send Notification</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Target Audience</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'all', label: 'All Users', icon: Users },
                    { value: 'purchased', label: 'Purchasers', icon: User },
                    { value: 'expiring', label: 'Expiring Soon', icon: Bell },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setForm({ ...form, target: opt.value })}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all ${
                        form.target === opt.value
                          ? 'border-brand-400 bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <opt.icon size={16} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Title</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="input"
                  placeholder="New papers available!"
                  maxLength={60}
                />
                <p className="text-xs text-gray-400 mt-1">{form.title.length}/60</p>
              </div>

              <div>
                <label className="label">Message</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm({ ...form, body: e.target.value })}
                  className="input h-28 resize-none"
                  placeholder="Your notification message here..."
                  maxLength={200}
                />
                <p className="text-xs text-gray-400 mt-1">{form.body.length}/200</p>
              </div>

              <button
                onClick={handleSend}
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 py-3 disabled:opacity-60"
              >
                <Send size={15} />
                {loading ? 'Sending...' : 'Send Notification'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Sent History</h2>
            {sent.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">No notifications sent yet.</div>
            ) : (
              <div className="space-y-3">
                {sent.map(n => (
                  <div key={n.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-semibold text-gray-800 text-sm">{n.title}</p>
                      <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[10px] font-semibold rounded-full shrink-0">Sent</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{n.body}</p>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>{format(new Date(n.created_at), 'dd MMM yyyy')}</span>
                      <span>{n.reach.toLocaleString()} recipients · {n.target}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
