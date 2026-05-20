import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Paplu Physics — Admin Panel',
  description: 'Admin dashboard for Paplu Physics',
  robots: 'noindex, nofollow', // Never index admin panel
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
        <Toaster position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
      </body>
    </html>
  )
}
