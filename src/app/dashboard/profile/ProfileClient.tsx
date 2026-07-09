'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Mail, Building2, Shield, Save, KeyRound, Camera } from 'lucide-react'
import { compressImage } from '@/lib/image'
import { uploadImage } from '@/lib/upload'
import type { UserProfile } from '@/types/models'
import { ROLE_LABELS } from '@/types/models'
import { updateProfileAction } from './actions'

export default function ProfileClient({ profile }: { profile: UserProfile }) {
  const router = useRouter()
  const [name, setName] = useState(profile.name)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = profile.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0]
    if (!original) return
    const file = await compressImage(original, 512) // avatar pequeno; comprime antes do upload
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    setSuccess(false)

    try {
      let avatarUrl: string | null = null

      let avatarFailed = false
      if (avatarFile) {
        // O avatar NÃO bloqueia a gravação do perfil: se o Storage falhar,
        // o nome é guardado na mesma e o utilizador é avisado. (bug 08)
        setUploadingAvatar(true)
        try {
          avatarUrl = await uploadImage(avatarFile, 'avatars')
        } catch {
          avatarFailed = true
        } finally {
          setUploadingAvatar(false)
        }
      }

      const fd = new FormData()
      fd.set('name', name)
      if (avatarUrl) fd.set('avatarUrl', avatarUrl)
      const result = await updateProfileAction({}, fd)

      setBusy(false)
      if (result.error) setError(result.error)
      else if (avatarFailed) {
        setError('Perfil guardado, mas a foto não foi carregada (serviço de imagens indisponível). Tenta novamente mais tarde.')
        setAvatarFile(null)
        router.refresh()
      }
      else {
        setSuccess(true)
        setAvatarFile(null)
        router.refresh()
      }
    } catch (err) {
      setUploadingAvatar(false)
      setBusy(false)
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    }
  }

  const currentAvatar = avatarPreview ?? profile.avatarUrl

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-5 text-base">Informação pessoal</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {currentAvatar ? (
              <Image
                src={currentAvatar}
                alt={profile.name}
                width={72}
                height={72}
                className="h-18 w-18 rounded-full object-cover border-2 border-gray-100"
                style={{ width: 72, height: 72 }}
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-full bg-[#2E86C1] flex items-center justify-center border-2 border-gray-100">
                <span className="text-xl font-bold text-white">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:text-[#2E86C1] transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{profile.name}</p>
            <p className="text-xs text-gray-400">{ROLE_LABELS[profile.role]}</p>
            {avatarFile && (
              <p className="text-xs text-[#2E86C1] mt-0.5">Nova foto selecionada</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">E-mail</p>
            <p className="flex items-center gap-1.5 text-gray-700">
              <Mail className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              {profile.email}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Papel</p>
            <p className="flex items-center gap-1.5 text-gray-700">
              <Shield className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              {ROLE_LABELS[profile.role]}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Empresa</p>
            <p className="flex items-center gap-1.5 text-gray-700">
              <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              {profile.company?.name ?? '—'}
            </p>
          </div>
          {profile.role === 'manager' && profile.company?.plan && (
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Plano</p>
              <p className="text-[#2E86C1] font-semibold capitalize">{profile.company.plan}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-4 border-t border-gray-100 pt-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input max-w-sm"
              required
              minLength={2}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">Perfil atualizado com sucesso.</p>}
          <button
            type="submit"
            disabled={busy || uploadingAvatar || (name.trim() === profile.name && !avatarFile)}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {uploadingAvatar ? 'A carregar foto…' : busy ? 'A guardar…' : 'Guardar alterações'}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-gray-800 mb-2 text-base flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-gray-400" />
          Alterar password
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Será enviado um e-mail para <strong>{profile.email}</strong> com instruções de recuperação.
        </p>
        <ResetPasswordButton email={profile.email} />
      </div>
    </div>
  )
}

function ResetPasswordButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function handleReset() {
    setBusy(true)
    try {
      const { getFirebaseAuth } = await import('@/lib/firebase/client')
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(getFirebaseAuth(), email)
      setSent(true)
    } catch {
      setSent(true)
    } finally {
      setBusy(false)
    }
  }

  if (sent) return <p className="text-sm text-green-600">E-mail de recuperação enviado. Verifica a tua caixa de entrada.</p>
  return (
    <button onClick={handleReset} disabled={busy} className="btn-secondary">
      {busy ? 'A enviar…' : 'Enviar e-mail de recuperação'}
    </button>
  )
}
