import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function shortMonth(dateStr: string) {
  return new Date(dateStr).toLocaleString('default', { month: 'short' })
}

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()

  // Last 7 months
  const since = new Date()
  since.setMonth(since.getMonth() - 6)
  since.setDate(1)
  const sinceIso = since.toISOString()

  const [
    { data: orders },
    { data: users },
    { data: purchases },
    { data: referrals },
  ] = await Promise.all([
    db.from('orders').select('amount, created_at').eq('status', 'paid').gte('created_at', sinceIso),
    db.from('users').select('created_at').gte('created_at', sinceIso),
    db.from('purchases').select('id, papers(categories(section))'),
    db.from('referrals').select('referrer_id, commission_amount').eq('status', 'paid'),
  ])

  // Build monthly map for last 7 months
  const months: string[] = []
  const monthLabels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    d.setDate(1)
    months.push(monthKey(d.toISOString()))
    monthLabels.push(shortMonth(d.toISOString()))
  }

  const revenueMap = new Map<string, number>()
  const orderMap = new Map<string, number>()
  for (const o of orders || []) {
    const k = monthKey(o.created_at)
    revenueMap.set(k, (revenueMap.get(k) || 0) + (o.amount || 0))
    orderMap.set(k, (orderMap.get(k) || 0) + 1)
  }

  const userMap = new Map<string, number>()
  for (const u of users || []) {
    const k = monthKey(u.created_at)
    userMap.set(k, (userMap.get(k) || 0) + 1)
  }

  const monthly = months.map((k, i) => ({
    month: monthLabels[i],
    revenue: revenueMap.get(k) || 0,
    purchases: orderMap.get(k) || 0,
    users: userMap.get(k) || 0,
  }))

  // Category split
  const catCount = new Map<string, number>()
  for (const p of purchases || []) {
    const section = (p.papers as any)?.categories?.section || 'other'
    catCount.set(section, (catCount.get(section) || 0) + 1)
  }
  const total = Array.from(catCount.values()).reduce((a, b) => a + b, 0) || 1
  const COLORS: Record<string, string> = {
    jee: '#7c3aed', neet: '#ef4444', gujcet: '#06b6d4',
    '90': '#1264F0', '75': '#f59e0b', pass: '#22c55e', board: '#64748b',
  }
  const categorySplit = Array.from(catCount.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({
      name: name.toUpperCase(),
      value: Math.round((count / total) * 100),
      color: COLORS[name] || '#94a3b8',
    }))

  // Top referrers
  const refMap = new Map<string, { earned: number; refs: number }>()
  for (const r of referrals || []) {
    const cur = refMap.get(r.referrer_id) || { earned: 0, refs: 0 }
    refMap.set(r.referrer_id, { earned: cur.earned + (r.commission_amount || 0), refs: cur.refs + 1 })
  }
  const topIds = Array.from(refMap.entries()).sort((a, b) => b[1].earned - a[1].earned).slice(0, 5).map(([id]) => id)
  const { data: topUsers } = topIds.length
    ? await db.from('users').select('id, name, mobile').in('id', topIds)
    : { data: [] }
  const uMap = new Map((topUsers || []).map(u => [u.id, u]))
  const topReferrers = Array.from(refMap.entries())
    .sort((a, b) => b[1].earned - a[1].earned)
    .slice(0, 5)
    .map(([id, stats]) => {
      const u = uMap.get(id)
      const name = u?.name || (u?.mobile ? `****${u.mobile.slice(-4)}` : 'Anonymous')
      return { name, ...stats }
    })

  // KPIs
  const totalRevenue = (orders || []).reduce((s, o) => s + (o.amount || 0), 0)
  const totalOrders = (orders || []).length

  return NextResponse.json({ monthly, categorySplit, topReferrers, totalRevenue, totalOrders })
}
