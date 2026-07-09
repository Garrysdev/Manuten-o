'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserX, ShieldCheck, Wrench, X, Eye, EyeOff, Link2, Copy, Check } from 'lucide-react'
import type { User } from '@/types/models'
import { createUserDirectAction, deactivateUserAction, generateInviteAction } from './actions'
import Avatar from '@/components/ui/Avatar'

export default function UsersClient({
  users,
  currentUserId,
  isManager,
}: {
  users: User[]
  currentUserId: string
  isManager: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteUrl, setInviteUrl] = useState('')
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [copied, setCopied] = useState(false)

  function closeForm() {
    setShowForm(false)
    setError('')
    setSuccess(false)
  }

  async function handleGenerateInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setInviteBusy(true)
    setInviteError('')
    const fd = new FormData(e.currentTarget)
    const result = await generateInviteAction({}, fd)
    setInviteBusy(false)
    if (result.error) { setInviteError(result.error); return }
    if (result.inviteUrl) setInviteUrl(result.inviteUrl)
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleAddUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const result = await createUserDirectAction({}, fd)
    setBusy(false)
    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      ;(e.currentTarget as HTMLFormElement).reset()
      router.refresh()
      setTimeout(() => { setSuccess(false); closeForm() }, 1500)
    }
  }

  function handleDeactivate(userId: string, name: string) {
    if (!confirm(`Desativar a conta de ${name}? O utilizador perderá acesso à plataforma.`)) return
    startTransition(async () => {
      await deactivateUserAction(userId)
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {isManager && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#2E86C1]" />
              Adicionar utilizador
            </h2>
            <button
              onClick={() => { showForm ? closeForm() : setShowForm(true) }}
              className="text-sm text-[#2E86C1] hover:underline"
            >
              {showForm ? 'Fechar' : 'Novo utilizador'}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleAddUser} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                  <input name="name" className="input" placeholder="Nome completo" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail *</label>
                  <input name="email" type="email" className="input" placeholder="nome@empresa.pt" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Papel</label>
                  <select name="role" className="input">
                    <option value="technician">Técnico</option>
                    <option value="manager">Gestor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password temporária *</label>
                  <div className="relative">
                    <input
                      name="tempPassword"
                      type={showPassword ? 'text' : 'password'}
                      className="input pr-9"
                      placeholder="Mín. 6 caracteres"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  Utilizador criado com sucesso.
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="btn-secondary flex items-center gap-1.5">
                  <X className="h-4 w-4" /> Cancelar
                </button>
                <button type="submit" disabled={busy} className="btn-primary">
                  {busy ? 'A criar…' : 'Criar utilizador'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Invite by link */}
      {isManager && (
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#2E86C1]" />
              Convidar por link
            </h2>
            <button
              onClick={() => { setShowInvite((v) => !v); setInviteUrl(''); setInviteError('') }}
              className="text-sm text-[#2E86C1] hover:underline"
            >
              {showInvite ? 'Fechar' : 'Gerar link de convite'}
            </button>
          </div>

          {showInvite && (
            <div className="space-y-3">
              {!inviteUrl ? (
                <form onSubmit={handleGenerateInvite} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail (opcional)</label>
                      <input name="email" type="email" className="input" placeholder="tecnico@empresa.pt" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Papel do convidado</label>
                      <select name="role" className="input">
                        <option value="technician">Técnico</option>
                        <option value="manager">Gestor</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={inviteBusy} className="btn-primary w-full">
                    {inviteBusy ? 'A gerar…' : 'Gerar link de convite'}
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Partilha este link com o técnico. Expira quando utilizado.</p>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <input
                      readOnly
                      value={inviteUrl}
                      className="flex-1 bg-transparent text-xs text-gray-700 outline-none truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="text-gray-400 hover:text-[#2E86C1] flex-shrink-0"
                      title="Copiar link"
                    >
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                  <button
                    onClick={() => setInviteUrl('')}
                    className="text-xs text-gray-400 hover:underline"
                  >
                    Gerar outro
                  </button>
                </div>
              )}
              {inviteError && <p className="text-xs text-red-600">{inviteError}</p>}
            </div>
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">E-mail</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Papel</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              {isManager && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.active ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <Avatar name={u.name} avatarUrl={u.avatarUrl} size={24} />
                    <span>
                      {u.name}
                      {u.id === currentUserId && (
                        <span className="ml-2 text-xs text-gray-400">(tu)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.role === 'manager'
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {u.role === 'manager'
                      ? <><ShieldCheck className="h-3 w-3" /> Gestor</>
                      : <><Wrench className="h-3 w-3" /> Técnico</>
                    }
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${u.active ? 'text-green-600' : 'text-gray-400'}`}>
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {isManager && (
                  <td className="px-4 py-3 text-right">
                    {u.active && u.id !== currentUserId && (
                      <button
                        onClick={() => handleDeactivate(u.id, u.name)}
                        disabled={isPending}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Desativar utilizador"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">
            Nenhum utilizador encontrado.
          </div>
        )}
      </div>
    </div>
  )
}
