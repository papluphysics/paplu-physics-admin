'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Users, IndianRupee, FileText, Clock, TrendingUp, ArrowUpRight } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

type Stats = {
  totalUsers: number
  activePapers: number
  pendingWithdrawals: number
  monthRevenue: number
  monthlyRevenue: { month: string; rev: number }[]
  dailyUsers: { day: string; users: number }[]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const month = new Date().toLocaleString('default', { month: 'long' })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
  }, [])

  const METRICS = [
    { label: 'Total Users',         value: stats ? stats.totalUsers.toLocaleString() : '—',           icon: Users,        color: 'text-blue-600 bg-blue-50' },
    { label: `${month} Revenue`,    value: stats ? `₹${stats.monthRevenue.toLocaleString()}` : '—',   icon: IndianRupee,  color: 'text-green-600 bg-green-50' },
    { label: 'Active Papers',       value: stats ? String(stats.activePapers) : '—',                  icon: FileText,     color: 'text-purple-600 bg-purple-50' },
    { label: 'Pending Withdrawals', value: stats ? String(stats.pendingWithdrawals) : '—',            icon: Clock,        color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Live</span>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {METRICS.map(m => (
              <div key={m.label} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.color}`}>
                    <m.icon size={16} />
                  </div>
                  <TrendingUp size={13} className="text-green-500 mt-1" />
                </div>
                <p className="font-bold text-2xl text-gray-900">{m.value}</p>
                <p className="text-xs text-gray-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">Monthly Revenue</h2>
                <span className="text-xs text-gray-400 font-semibold">Last 6 months</span>
              </div>
              {stats ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={stats.monthlyRevenue} barSize={28}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }}
                    />
                    <Bar dataKey="rev" fill="#1264F0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">Loading chart...</div>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 text-sm">Daily New Signups</h2>
                <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                  <ArrowUpRight size={12} /> This week
                </span>
              </div>
              {stats ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={stats.dailyUsers}>
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }} />
                    <Line type="monotone" dataKey="users" stroke="#1264F0" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-300 text-sm">Loading chart...</div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a href="/papers" className="card p-5 hover:border-brand-200 transition-colors group">
              <FileText size={20} className="text-brand-500 mb-2" />
              <p className="font-semibold text-gray-800 text-sm">Manage Papers</p>
              <p className="text-xs text-gray-400 mt-0.5">Add, edit, or remove paper sets</p>
            </a>
            <a href="/categories" className="card p-5 hover:border-brand-200 transition-colors group">
              <TrendingUp size={20} className="text-purple-500 mb-2" />
              <p className="font-semibold text-gray-800 text-sm">Manage Subjects</p>
              <p className="text-xs text-gray-400 mt-0.5">Add or delete subject categories</p>
            </a>
            <a href="/withdrawals" className="card p-5 hover:border-brand-200 transition-colors group">
              <Clock size={20} className="text-amber-500 mb-2" />
              <p className="font-semibold text-gray-800 text-sm">Withdrawals</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {stats?.pendingWithdrawals ? `${stats.pendingWithdrawals} pending approval` : 'Approve or reject requests'}
              </p>
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
