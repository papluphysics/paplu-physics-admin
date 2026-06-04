import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    const db   = createAdminSupabase()
    const patch: Record<string, unknown> = {}

    if ('image_url'       in body) patch.image_url       = body.image_url       || null
    if ('title'           in body) patch.title           = body.title           || null
    if ('link_url'        in body) patch.link_url        = body.link_url        || null
    if ('target_state'    in body) patch.target_state    = body.target_state    || null
    if ('target_district' in body) patch.target_district = body.target_district || null
    if ('target_city'     in body) patch.target_city     = body.target_city     || null
    if ('region'          in body) patch.region          = body.region          || null
    if ('expiry_date'     in body) patch.expiry_date     = body.expiry_date
    if ('is_active'       in body) patch.is_active       = Boolean(body.is_active)
    if ('priority'        in body) patch.priority        = Number(body.priority ?? 0)

    const { data: ad, error } = await db
      .from('ads')
      .update(patch)
      .eq('id', params.id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ad })
  } catch (err) {
    console.error('Update ad error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = createAdminSupabase()
  const { error } = await db.from('ads').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
