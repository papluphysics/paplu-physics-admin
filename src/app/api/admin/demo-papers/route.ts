import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()

  const { data, error } = await db
    .from('demo_papers')
    .select('id, title, title_gu, description, description_gu, subject, class_level, pdf_url, is_active, created_at')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { title, title_gu, description, description_gu, subject, class_level, pdf_url } = body

  if (!title?.trim() || !pdf_url?.trim()) {
    return NextResponse.json({ error: 'Title and PDF URL are required' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('demo_papers')
    .insert({
      title: title.trim(),
      title_gu: title_gu?.trim() || null,
      description: description?.trim() || null,
      description_gu: description_gu?.trim() || null,
      subject: subject || 'general',
      class_level: class_level || '10',
      pdf_url: pdf_url.trim(),
      is_active: true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
