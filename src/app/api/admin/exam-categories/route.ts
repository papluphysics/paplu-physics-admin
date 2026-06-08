import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { data, error } = await db
    .from('exam_categories')
    .select('*')
    .order('type')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const name = (body.name || '').trim()
  const type = body.type

  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (type !== 'standard' && type !== 'competitive_exam') {
    return NextResponse.json({ error: 'type must be standard or competitive_exam' }, { status: 400 })
  }

  const db = createAdminSupabase()
  const { data, error } = await db
    .from('exam_categories')
    .insert({ name, type })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
