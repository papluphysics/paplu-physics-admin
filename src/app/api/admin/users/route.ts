import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()

  const [{ data: users, error }, { data: purchases }, { data: referrals }] = await Promise.all([
    db.from('users').select('id, name, mobile, email, wallet_balance, is_blocked, created_at, referral_code').order('created_at', { ascending: false }),
    db.from('purchases').select('user_id'),
    db.from('referrals').select('referrer_id'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const pcMap = new Map<string, number>()
  for (const p of purchases || []) pcMap.set(p.user_id, (pcMap.get(p.user_id) || 0) + 1)

  const rcMap = new Map<string, number>()
  for (const r of referrals || []) rcMap.set(r.referrer_id, (rcMap.get(r.referrer_id) || 0) + 1)

  const data = (users || []).map(u => ({
    ...u,
    purchase_count: pcMap.get(u.id) || 0,
    referral_count: rcMap.get(u.id) || 0,
  }))

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, is_blocked } = await req.json()
  const db = createAdminSupabase()
  const { error } = await db.from('users').update({ is_blocked }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
