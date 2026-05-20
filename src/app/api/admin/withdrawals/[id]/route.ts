import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabase, verifyAdminToken } from '@/lib/supabase'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!verifyAdminToken(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { status } = await req.json()
  if (!['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  const db = createAdminSupabase()

  const { data: w } = await db.from('withdrawals').select('*').eq('id', params.id).single()
  if (!w) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (w.status !== 'pending') return NextResponse.json({ error: 'Already processed' }, { status: 400 })

  await db.from('withdrawals').update({ status }).eq('id', params.id)

  if (status === 'rejected') {
    // Refund wallet balance
    const { data: user } = await db.from('users').select('wallet_balance').eq('id', w.user_id).single()
    if (user) {
      await db.from('users').update({ wallet_balance: user.wallet_balance + w.amount }).eq('id', w.user_id)
      await db.from('wallet_transactions').insert({
        user_id: w.user_id,
        amount: w.amount,
        type: 'credit',
        reason: 'refund',
        reference: w.id,
        status: 'completed',
      })
    }
  }

  return NextResponse.json({ success: true })
}
