import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

function monthKey(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createAdminSupabase()

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Go back 6 months for chart
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  const chartSince = sixMonthsAgo.toISOString()

  // Go back 7 days for daily user signups chart
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)
  const weekSince = sevenDaysAgo.toISOString()

  const [
    { count: totalUsers },
    { count: activePapers },
    { count: pendingWithdrawals },
    { data: revenueData },
    { data: chartOrders },
    { data: weekUsers },
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }),
    db.from('papers').select('*', { count: 'exact', head: true }).eq('is_active', true),
    db.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('orders').select('amount').eq('status', 'paid').gte('created_at', monthStart),
    db.from('orders').select('amount, created_at').eq('status', 'paid').gte('created_at', chartSince),
    db.from('users').select('created_at').gte('created_at', weekSince),
  ])

  const monthRevenue = (revenueData || []).reduce((sum, o) => sum + (o.amount || 0), 0)

  // Build 6-month revenue chart
  const months: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    d.setDate(1)
    const key = monthKey(d.toISOString())
    const label = d.toLocaleString('default', { month: 'short' })
    months.push({ key, label })
  }
  const revMap = new Map<string, number>()
  for (const o of chartOrders || []) {
    const k = monthKey(o.created_at)
    revMap.set(k, (revMap.get(k) || 0) + (o.amount || 0))
  }
  const monthlyRevenue = months.map(({ key, label }) => ({ month: label, rev: revMap.get(key) || 0 }))

  // Build 7-day daily signups chart
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const dayMap = new Map<string, number>()
  for (const u of weekUsers || []) {
    const d = new Date(u.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    dayMap.set(key, (dayMap.get(key) || 0) + 1)
  }
  const dailyUsers = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    return { day: DAYS[d.getDay()], users: dayMap.get(key) || 0 }
  })

  return NextResponse.json({
    totalUsers: totalUsers ?? 0,
    activePapers: activePapers ?? 0,
    pendingWithdrawals: pendingWithdrawals ?? 0,
    monthRevenue,
    monthlyRevenue,
    dailyUsers,
  })
}
