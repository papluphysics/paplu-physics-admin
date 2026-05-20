'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

type AnalyticsData = {
  monthly: { month: string; revenue: number; purchases: number; users: number }[]
  categorySplit: { name: string; value: number; color: string }[]
  topReferrers: { name: string; earned: number; refs: number }[]
  totalRevenue: number
  totalOrders: number
}

const TOOLTIP_STYLE = { fontSize: 12, borderRadius: 8, border: '1px solid #f3f4f6' }

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/analytics', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Last 7 months · Live data</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-40 text-gray-400">Loading analytics...</div>
        ) : (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Revenue (7mo)', value: `₹${(data?.totalRevenue || 0).toLocaleString()}` },
                { label: 'Total Orders (7mo)', value: String(data?.totalOrders || 0) },
                { label: 'Avg Order Value', value: data?.totalOrders ? `₹${Math.round((data.totalRevenue || 0) / data.totalOrders)}` : '—' },
                { label: 'Categories', value: String(data?.categorySplit.length || 0) },
              ].map(k => (
                <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <p className="text-xs text-gray-400">{k.label}</p>
                  <p className="font-bold text-2xl text-gray-900 mt-1">{k.value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Revenue vs Orders</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data?.monthly || []} barGap={4}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis yAxisId="left" hide />
                    <YAxis yAxisId="right" orientation="right" hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => [
                      name === 'revenue' ? `₹${v.toLocaleString()}` : v, name
                    ]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar yAxisId="left" dataKey="revenue" name="Revenue (₹)" fill="#1264F0" radius={[4, 4, 0, 0]} barSize={18} />
                    <Bar yAxisId="right" dataKey="purchases" name="Orders" fill="#06b6d4" radius={[4, 4, 0, 0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">New Users / Month</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data?.monthly || []}>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Line type="monotone" dataKey="users" name="New Users" stroke="#1264F0" strokeWidth={2.5} dot={{ r: 4, fill: '#1264F0' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Sales by Category</h2>
                {data?.categorySplit.length ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={data.categorySplit} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {data.categorySplit.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, 'Share']} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-col gap-1.5 mt-2">
                      {data.categorySplit.map(c => (
                        <div key={c.name} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
                          <span className="text-gray-600 flex-1">{c.name}</span>
                          <span className="font-semibold text-gray-800">{c.value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">No purchase data yet</div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 text-sm mb-4">Top Referrers</h2>
                {data?.topReferrers.length ? (
                  <div className="space-y-3">
                    {data.topReferrers.map((r, i) => (
                      <div key={r.name} className="flex items-center gap-3">
                        <span className="text-sm font-bold text-gray-400 w-5 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{r.name}</p>
                          <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(r.refs / (data.topReferrers[0]?.refs || 1)) * 100}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold text-green-600">₹{r.earned.toFixed(2)}</p>
                          <p className="text-[10px] text-gray-400">{r.refs} refs</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-400 text-sm">No referral data yet</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
