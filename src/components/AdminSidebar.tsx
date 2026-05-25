'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, FileText, Users, Wallet, Tag, BarChart2,
  Bell, Settings, LogOut, Zap, Download, BookOpen, Star, Gift
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/papers',       label: 'Papers',        icon: FileText },
  { href: '/demo-papers',  label: 'Demo Papers',   icon: Gift },
  { href: '/categories',   label: 'Subjects',      icon: BookOpen },
  { href: '/users',        label: 'Users',         icon: Users },
  { href: '/withdrawals',  label: 'Withdrawals',   icon: Wallet },
  { href: '/coupons',      label: 'Coupons',       icon: Tag },
  { href: '/reviews',      label: 'Reviews',       icon: Star },
  { href: '/analytics',    label: 'Analytics',     icon: BarChart2 },
  { href: '/downloads',    label: 'Downloads',     icon: Download },
  { href: '/notifications',label: 'Notifications', icon: Bell },
  { href: '/settings',     label: 'Settings',      icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = () => {
    localStorage.removeItem('admin_token')
    router.push('/')
  }

  return (
    <aside className="w-56 bg-gray-900 min-h-screen flex flex-col shrink-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <Zap size={13} className="text-white fill-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">PapluPhysics</p>
            <p className="text-gray-500 text-[10px] mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-brand-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-gray-700/50">
        <button
          onClick={logout}
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-gray-800 w-full transition-all"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </aside>
  )
}
