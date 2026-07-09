'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentProfile } from '@/lib/firebase/session'
import { updateUserProfile } from '@/lib/firebase/data'

export type ProfileFormState = { error?: string; ok?: boolean }

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const profile = await getCurrentProfile()
  if (!profile) return { error: 'Sessão expirada.' }

  const name = String(formData.get('name') ?? '').trim()
  if (!name || name.length < 2) return { error: 'Nome inválido (mínimo 2 caracteres).' }

  const avatarUrl = formData.has('avatarUrl')
    ? String(formData.get('avatarUrl') ?? '').trim() || null
    : undefined

  try {
    await updateUserProfile(profile.id, { name, ...(avatarUrl !== undefined ? { avatarUrl } : {}) })
    revalidatePath('/dashboard/profile')
    revalidatePath('/dashboard')
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro ao atualizar perfil.' }
  }
}
