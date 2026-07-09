'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase/client'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ClipboardList, Package, History, LogOut, Menu, X,
  Users, FileBarChart, Bell, CreditCard, Lock, UserCircle, Calendar, Wrench, Boxes,
} from 'lucide-react'
import { planHas, type FeatureKey } from '@/lib/plans'
import type { PlanName } from '@/types/models'
import UpgradeModal from '@/components/ui/UpgradeModal'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  feature?: FeatureKey
}

interface SidebarProps {
  user: {
    name: string
    role: string
    avatarUrl?: string | null
    company?: { name: string; plan?: string } | null
  }
}

const managerNavItems: NavItem[] = [
  { href: '/dashboard',                    label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/dashboard/tasks',              label: 'Tarefas',         icon: ClipboardList },
  { href: '/dashboard/calendar',           label: 'Calendário',      icon: Calendar,       feature: 'calendar' },
  { href: '/dashboard/maintenance-plan',   label: 'Plano Manut.',    icon: Wrench,         feature: 'maintenance-plan' },
  { href: '/dashboard/assets',             label: 'Equipamentos',    icon: Package,        feature: 'assets' },
  { href: '/dashboard/stocks',             label: 'Stocks',          icon: Boxes,          feature: 'stocks' },
  { href: '/dashboard/history',            label: 'Histórico',       icon: History,        feature: 'history' },
  { href: '/dashboard/users',              label: 'Utilizadores',    icon: Users,          feature: 'users' },
  { href: '/dashboard/reports',            label: 'Relatórios',      icon: FileBarChart,   feature: 'reports' },
  { href: '/dashboard/billing',            label: 'Upgrade',         icon: CreditCard },
]

const techNavItems: NavItem[] = [
  { href: '/dashboard/tasks',   label: 'Tarefas',   icon: ClipboardList },
  { href: '/dashboard/history', label: 'Histórico', icon: History },
  { href: '/dashboard/profile', label: 'Perfil',    icon: UserCircle },
]

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lockedFeature, setLockedFeature] = useState<FeatureKey | null>(null)

  const plan = (user.company?.plan ?? 'free') as PlanName

  async function handleLogout() {
    await signOut(getFirebaseAuth())
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/login')
    router.refresh()
  }

  const navItems = user.role === 'manager' ? managerNavItems : techNavItems

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map(({ href, label, icon: Icon, feature }) => {
        const locked = user.role === 'manager' && !!feature && !planHas(plan, feature)
        const active = !locked && (pathname === href || (href !== '/dashboard' && pathname.startsWith(href)))

        if (locked) {
          return (
            <button
              key={href}
              onClick={() => { setOpen(false); setLockedFeature(feature!) }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-50 transition-colors"
              title="Funcionalidade não incluída no plano atual"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-gray-300" />
              <span className="flex-1 text-left">{label}</span>
              <Lock className="h-3 w-3 text-gray-300" />
            </button>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-[#EAF4FB] text-[#1B4F72] font-semibold'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            )}
          >
            <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-[#1B4F72]' : 'text-gray-400')} />
            {label}
            {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#1B4F72]" />}
          </Link>
        )
      })}
    </nav>
  )

  const initials = user.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const UserSection = () => (
    <div className="px-3 pb-4 border-t border-gray-100 pt-3">
      <div className="rounded-lg bg-gray-50 px-3 py-2.5 mb-2 flex items-center gap-3">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt={user.name}
            width={36}
            height={36}
            className="h-9 w-9 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#2E86C1] flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-white">{initials}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
          <p className="text-xs text-gray-400 capitalize">
            {user.role === 'manager' ? 'Gestor' : 'Técnico'} · {user.company?.name ?? ''}
          </p>
          {user.role === 'manager' && (
            <p className="text-xs text-[#2E86C1] font-medium capitalize">{plan}</p>
          )}
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </button>
    </div>
  )

  const Logo = () => (
    <div className="flex items-center justify-center px-4 py-4 border-b border-gray-100">
      <Image src="/logo-rg.png" alt="RG Maintenance" width={140} height={78} className="h-14 w-auto" priority />
    </div>
  )

  return (
    <>
      {lockedFeature && (
        <UpgradeModal feature={lockedFeature} onClose={() => setLockedFeature(null)} />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col bg-white border-r border-gray-200 min-h-screen">
        <Logo />
        <NavLinks />
        <UserSection />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
        <Image src="/logo-rg.png" alt="RG Maintenance" width={100} height={56} className="h-9 w-auto" />
        <div className="flex items-center gap-2">
          <button className="p-1.5 text-gray-400 hover:text-gray-600">
            <Bell className="h-5 w-5" />
          </button>
          <button onClick={() => setOpen(true)} className="p-1.5 text-gray-500 hover:text-gray-700">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <aside className="relative flex w-64 flex-col bg-white h-full shadow-2xl border-r border-gray-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <Image src="/logo-rg.png" alt="RG Maintenance" width={110} height={62} className="h-9 w-auto" />
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks />
            <UserSection />
          </aside>
        </div>
      )}
    </>
  )
}
