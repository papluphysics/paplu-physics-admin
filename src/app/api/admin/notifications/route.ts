import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('admin_notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ data: [] })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { title, body, target } = await req.json()
  if (!title || !body) return NextResponse.json({ error: 'Title and body required' }, { status: 400 })

  const db = createAdminSupabase()

  // Count recipients
  let reach = 0
  if (target === 'all') {
    const { count } = await db.from('users').select('*', { count: 'exact', head: true })
    reach = count ?? 0
  } else if (target === 'purchased') {
    const { count } = await db.from('purchases').select('user_id', { count: 'exact', head: true })
    reach = count ?? 0
  }

  const { data, error } = await db
    .from('admin_notifications')
    .insert({ title, body, target, reach })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
