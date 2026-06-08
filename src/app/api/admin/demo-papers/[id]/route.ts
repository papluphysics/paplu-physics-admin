import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const db = createAdminSupabase()

  // Map demo-papers page fields to papers table columns
  const update: Record<string, unknown> = {}
  if (body.is_active !== undefined) update.is_active = body.is_active
  if (body.title !== undefined)    update.title_en = body.title
  if (body.title_gu !== undefined) update.title_gu = body.title_gu
  if (body.description !== undefined)    update.description_en = body.description
  if (body.description_gu !== undefined) update.description_gu = body.description_gu
  if (body.subject !== undefined)        update.subject = body.subject
  if (body.pdf_url !== undefined)        update.pdf_url = body.pdf_url
  if (body.exam_category_id !== undefined) update.exam_category_id = body.exam_category_id

  const { error } = await db.from('papers').update(update).eq('id', params.id).eq('is_demo', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { error } = await db.from('papers').delete().eq('id', params.id).eq('is_demo', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
