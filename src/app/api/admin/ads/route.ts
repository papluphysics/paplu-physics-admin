import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  // Service role bypasses RLS — admin sees ALL ads including expired/inactive
  const { data: ads, error } = await db
    .from('ads')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ads: ads ?? [] })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const { image_url, title, link_url, target_state, target_district, target_city, region, expiry_date, is_active, priority } = body

    if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 })
    if (!expiry_date) return NextResponse.json({ error: 'expiry_date is required' }, { status: 400 })

    const db = createAdminSupabase()
    const { data: ad, error } = await db
      .from('ads')
      .insert({
        image_url,
        title:           title           || null,
        link_url:        link_url        || null,
        target_state:    target_state    || null,
        target_district: target_district || null,
        target_city:     target_city     || null,
        region:          region          || null,
        expiry_date,
        is_active:       is_active !== false,
        priority:        priority ?? 0,
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ad }, { status: 201 })
  } catch (err) {
    console.error('Create ad error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
