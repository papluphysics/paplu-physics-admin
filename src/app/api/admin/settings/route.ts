import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createAdminSupabase()
  const { data: settingsRows } = await db.from('settings').select('key, value')
  const settings: Record<string, string | null> = {}
  for (const row of settingsRows || []) settings[row.key] = row.value

  const integrations = [
    {
      name: 'Supabase Database',
      connected: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')),
      note: 'NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY',
    },
    {
      name: 'Razorpay Payments',
      connected: !!(process.env.RAZORPAY_KEY_SECRET && !process.env.RAZORPAY_KEY_SECRET.includes('placeholder')),
      note: 'RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET',
    },
    {
      name: 'Cloudflare R2 Storage',
      connected: !!(process.env.R2_ACCOUNT_ID && !process.env.R2_ACCOUNT_ID.includes('placeholder')),
      note: 'R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY',
    },
    {
      name: 'Google OAuth',
      connected: !!(process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')),
      note: 'Configured via Supabase Auth → Providers → Google',
    },
  ]

  return NextResponse.json({ integrations, settings })
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { key, value } = body
  if (!key) return NextResponse.json({ error: 'key is required' }, { status: 400 })

  const db = createAdminSupabase()
  const { error } = await db
    .from('settings')
    .upsert({ key, value: value ?? null }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
