import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { data, error } = await db.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { code, type, value, max_uses, expiry_date } = body
  if (!code || !type || value === undefined || !expiry_date) {
    return NextResponse.json({ error: 'code, type, value and expiry_date are required' }, { status: 400 })
  }
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('coupons')
    .insert({ code: code.toUpperCase(), type, value: Number(value), max_uses: Number(max_uses) || 999, expiry_date, is_active: true, use_count: 0 })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
