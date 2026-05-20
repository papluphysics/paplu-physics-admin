import { createClient } from '@supabase/supabase-js'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

export function createAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export function verifyAdminToken(req: NextRequest): boolean {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return false
  try {
    const payload = jwt.verify(
      token,
      process.env.ADMIN_SECRET_KEY || 'admin-dev-secret'
    ) as { role?: string }
    return payload.role === 'admin'
  } catch {
    return false
  }
}
