import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('papers')
    .select(
      'id, title_en, title_gu, description_en, description_gu, price, paper_count, is_popular, is_active, is_demo, marking_scheme, created_at, category_id, subject, exam_category_id, categories(label_en, label_gu, class_level, subject, section), exam_categories(id, name, type)'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const {
    title_en, title_gu, description_en, description_gu,
    category_id, exam_category_id, subject,
    price, paper_count, is_popular, is_demo, marking_scheme,
  } = body

  if (!title_en?.trim()) {
    return NextResponse.json({ error: 'title_en is required' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('papers')
    .insert({
      title_en: title_en.trim(),
      title_gu: title_gu?.trim() || null,
      description_en: description_en?.trim() || null,
      description_gu: description_gu?.trim() || null,
      category_id: category_id || null,
      exam_category_id: exam_category_id || null,
      subject: subject?.trim() || null,
      price: price ?? 25,
      paper_count: paper_count ?? 1,
      is_popular: is_popular ?? false,
      is_demo: is_demo ?? false,
      marking_scheme: marking_scheme?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
