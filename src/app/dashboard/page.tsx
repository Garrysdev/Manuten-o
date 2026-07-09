import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentProfile } from '@/lib/firebase/session'
import { listTasks, listUsers } from '@/lib/firebase/data'
import { formatDate } from '@/lib/utils'
import { CheckCircle, Clock, AlertTriangle, Wrench, Plus, ClipboardList } from 'lucide-react'
import DashboardTasksTable from './DashboardTasksTable'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role === 'technician') redirect('/dashboard/tasks')

  const [tasks, users] = await Promise.all([
    listTasks(profile.companyId),
    listUsers(profile.companyId),
  ])
  const userRefs = users.map((u) => ({ id: u.id, name: u.name }))

  const total = tasks.length
  const pending = tasks.filter((t) => t.status === 'pending').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const done = tasks.filter((t) => t.status === 'done').length
  const critical = tasks.filter(
    (t) => t.criticidade === 'vermelho' && t.status !== 'done' && t.status !== 'cancelled'
  ).length

  const recentTasks = tasks.slice(0, 8)

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Cabeçalho estilo AI Studio */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#1B4F72] tracking-tight leading-tight">
          Dashboard de<br />Manutenção
        </h1>
        <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">
          {profile.company?.name} · {formatDate(new Date().toISOString())}
        </p>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <Link href="/dashboard/tasks" className="btn-secondary flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Gestão de Tarefas
        </Link>
        <Link href="/dashboard/tasks" className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Tarefa
        </Link>
      </div>

      {critical > 0 && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{critical} tarefa{critical > 1 ? 's' : ''} crítica{critical > 1 ? 's' : ''}</strong>{' '}
            por resolver.
          </span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Total</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-[#1B4F72]">{total}</p>
            <Wrench className="h-7 w-7 text-[#AED6F1] mb-1" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Tarefas</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Pendentes</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-amber-500">{pending}</p>
            <Clock className="h-7 w-7 text-amber-200 mb-1" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Por iniciar</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Em Curso</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-blue-600">{inProgress}</p>
            <AlertTriangle className="h-7 w-7 text-blue-200 mb-1" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Em execução</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Concluídas</p>
          <div className="flex items-end justify-between">
            <p className="text-4xl font-black text-emerald-600">{done}</p>
            <CheckCircle className="h-7 w-7 text-emerald-200 mb-1" />
          </div>
          <p className="text-xs text-gray-400 mt-2">Finalizadas</p>
        </div>
      </div>

      {/* Tarefas recentes */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-800 text-base uppercase tracking-wide">Geral de Tarefas</h2>
          <Link href="/dashboard/tasks" className="text-sm text-[#1B4F72] hover:underline font-semibold">
            Ver todas →
          </Link>
        </div>

        <DashboardTasksTable tasks={recentTasks} users={userRefs} />
      </div>
    </div>
  )
}
