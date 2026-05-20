'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

type Integration = { name: string; connected: boolean; note: string }

export default function AdminSettingsPage() {
  const [show, setShow] = useState(false)
  const [adminPass, setAdminPass] = useState('')
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  useEffect(() => {
    fetch('/api/admin/settings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.integrations) setIntegrations(d.integrations) })
      .catch(() => {})
  }, [token])

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Settings</h1>
        </div>

        <div className="p-6 max-w-2xl space-y-6">
          {/* Admin Password */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Change Admin Password</h2>
            <div className="relative mb-4">
              <label className="label">New Password</label>
              <input
                type={show ? 'text' : 'password'}
                value={adminPass}
                onChange={e => setAdminPass(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-8 text-gray-400">
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 mb-4">
              After changing password, generate bcrypt hash and update <code className="font-mono">ADMIN_PASSWORD_HASH</code> in your <code className="font-mono">.env.local</code> file.
              <br />Run: <code className="font-mono bg-amber-100 px-1 rounded">node -e &quot;const b=require('bcryptjs');console.log(b.hashSync('newpassword',10))&quot;</code>
            </div>
            <button
              onClick={() => {
                if (adminPass.length < 8) { toast.error('Min 8 characters'); return }
                navigator.clipboard.writeText(`node -e "const b=require('bcryptjs');console.log(b.hashSync('${adminPass}',10))"`)
                toast.success('Command copied — run it in terminal to get hash')
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Save size={14} /> Copy Hash Command
            </button>
          </div>

          {/* Integration Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-5">Integration Status</h2>
            <div className="space-y-3">
              {integrations.map(s => (
                <div key={s.name} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${s.connected ? 'bg-green-500' : 'bg-red-400'}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{s.name}</p>
                    <p className="text-xs text-gray-400">{s.note}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${s.connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                    {s.connected ? 'Connected' : 'Not set'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Business Rules Info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Business Rules</h2>
            <div className="space-y-2 text-sm text-gray-600">
              {[
                ['Single paper price', '₹25'],
                ['Combo (any 3 papers)', '₹60'],
                ['Referral commission', '20% (post Razorpay fee)'],
                ['Access validity', '6 months after purchase'],
                ['Min wallet withdrawal', '₹15'],
                ['Max devices per user', '2'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-semibold text-gray-900">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
