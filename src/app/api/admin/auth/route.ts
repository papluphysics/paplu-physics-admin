import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// Admin credentials — change these and move to env variables!
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@papluphysics.in'
// Generate hash: node -e "const b=require('bcryptjs');console.log(b.hashSync('YourPasswordHere',10))"
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$placeholder_hash_change_this'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    let valid = false
    try {
      valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH)
    } catch {
      // Hash format invalid — fall through to dev fallback below
    }
    if (!valid) {
      // For development without hash — remove in production!
      if (process.env.NODE_ENV === 'development' && password === 'admin123') {
        // Allow dev login
      } else {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }
    }

    const token = jwt.sign(
      { email, role: 'admin', iat: Math.floor(Date.now() / 1000) },
      process.env.ADMIN_SECRET_KEY || 'admin-dev-secret',
      { expiresIn: '8h' }
    )

    return NextResponse.json({ token, email, role: 'admin' })
  } catch (err) {
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}
