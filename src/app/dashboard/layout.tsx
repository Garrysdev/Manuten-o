import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/firebase/session'
import Sidebar from '@/components/layout/Sidebar'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/api/auth/logout')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={{
          name: profile.name,
          role: profile.role,
          avatarUrl: profile.avatarUrl ?? null,
          company: profile.company
            ? { name: profile.company.name, plan: profile.company.plan }
            : null,
        }}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">{children}</main>
      </div>
    </div>
  )
}
