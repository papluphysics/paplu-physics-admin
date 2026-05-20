/** @type {import('next').NextConfig} */
const nextConfig = {
  // Admin runs on separate port / subdomain (admin.papluphysics.in)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}
module.exports = nextConfig
