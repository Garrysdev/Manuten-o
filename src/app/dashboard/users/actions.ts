'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/firebase/session'
import { createUserDirect, deactivateUser, countActiveUsers, createInviteToken } from '@/lib/firebase/data'
import { LIMITS } from '@/lib/plans'
import type { UserRole, PlanName } from '@/types/models'

export type UserActionState = { error?: string; ok?: boolean }

export async function createUserDirectAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: 'Sessão expirada.' }
  if (profile.role !== 'manager') return { error: 'Sem permissão.' }

  const plan = (profile.company?.plan ?? 'free') as PlanName
  const activeCount = await countActiveUsers(profile.companyId)
  const { maxUsers } = LIMITS[plan]
  if (activeCount >= maxUsers) {
    return {
      error: `Limite de ${maxUsers} utilizador(es) atingido no plano ${plan}. Faz upgrade para adicionar mais.`,
    }
  }

  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const role = String(formData.get('role') ?? 'technician') as UserRole
  const tempPassword = String(formData.get('tempPassword') ?? '').trim()

  if (!name || !email || !tempPassword) return { error: 'Preenche todos os campos.' }
  if (tempPassword.length < 6) return { error: 'A password deve ter pelo menos 6 caracteres.' }

  try {
    await createUserDirect(profile.companyId, { email, name, role, tempPassword })
    revalidatePath('/dashboard/users')
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('email-already-exists') || msg.includes('already exists')) {
      return { error: 'Este e-mail já está registado.' }
    }
    return { error: msg || 'Erro ao criar utilizador.' }
  }
}

export async function generateInviteAction(
  _prev: UserActionState,
  formData: FormData
): Promise<UserActionState & { inviteUrl?: string }> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: 'Sessão expirada.' }
  if (profile.role !== 'manager') return { error: 'Sem permissão.' }

  const role = String(formData.get('role') ?? 'technician') as UserRole
  const email = String(formData.get('email') ?? '').trim().toLowerCase() || undefined
  try {
    const { token } = await createInviteToken(profile.companyId, role, email)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rg-maintenance.vercel.app'
    const emailParam = email ? `&email=${encodeURIComponent(email)}` : ''
    const inviteUrl = `${baseUrl}/register?invite=${token}${emailParam}`
    return { ok: true, inviteUrl }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao gerar convite.' }
  }
}

export async function deactivateUserAction(userId: string): Promise<UserActionState> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: 'Sessão expirada.' }
  if (profile.role !== 'manager') return { error: 'Sem permissão.' }
  if (userId === profile.id) return { error: 'Não podes desativar a tua própria conta.' }

  try {
    await deactivateUser(profile.companyId, userId)
    revalidatePath('/dashboard/users')
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao desativar utilizador.' }
  }
}
