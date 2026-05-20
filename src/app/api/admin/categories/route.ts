import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('categories')
    .select('*')
    .order('class_level')
    .order('subject')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { class_level, subject, section, label_en, label_gu } = body

  if (!class_level || !subject || !section || !label_en || !label_gu) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('categories')
    .insert({ class_level, subject, section, label_en, label_gu })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
