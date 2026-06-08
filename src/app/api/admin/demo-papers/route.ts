import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()

  const { data, error } = await db
    .from('papers')
    .select('id, title_en, title_gu, description_en, description_gu, subject, pdf_url, is_active, is_demo, created_at, exam_category_id, exam_categories(id, name, type)')
    .eq('is_demo', true)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const normalized = (data || []).map((p: any) => ({
    id: p.id,
    title: p.title_en,
    title_gu: p.title_gu,
    description: p.description_en,
    description_gu: p.description_gu,
    subject: p.subject || '',
    class_level: p.exam_categories?.name || '',
    exam_category_id: p.exam_category_id,
    pdf_url: p.pdf_url || '',
    is_active: p.is_active,
    created_at: p.created_at,
  }))

  return NextResponse.json({ data: normalized })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, title_gu, description, description_gu, subject, exam_category_id, pdf_url } = body

  if (!title?.trim() || !pdf_url?.trim()) {
    return NextResponse.json({ error: 'Title and PDF URL are required' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('papers')
    .insert({
      title_en: title.trim(),
      title_gu: title_gu?.trim() || null,
      description_en: description?.trim() || null,
      description_gu: description_gu?.trim() || null,
      subject: subject?.trim() || null,
      exam_category_id: exam_category_id || null,
      pdf_url: pdf_url.trim(),
      is_demo: true,
      is_active: true,
      price: 0,
      paper_count: 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
