import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('papers')
    .select('id, title_en, title_gu, description_en, description_gu, price, paper_count, is_popular, is_active, created_at, category_id, categories(label_en, label_gu, class_level, subject, section)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const { title_en, title_gu, description_en, description_gu, category_id, price, paper_count, is_popular } = body

  if (!title_en || !category_id) {
    return NextResponse.json({ error: 'title_en and category_id are required' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('papers')
    .insert({ title_en, title_gu, description_en, description_gu, category_id, price: price ?? 25, paper_count: paper_count ?? 1, is_popular: is_popular ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
