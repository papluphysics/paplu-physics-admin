import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('download_logs')
    .select('*, users(name, mobile, email), papers(title_en)')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ data: [] })
  }
  return NextResponse.json({ data })
}
