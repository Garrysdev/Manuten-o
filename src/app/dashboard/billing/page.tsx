import { redirect } from 'next/navigation'
import { getCurrentProfile } from '@/lib/firebase/session'
import { CheckCircle, Star, AlertTriangle } from 'lucide-react'
import { UpgradeButton, ManageButton } from './BillingClient'

export const dynamic = 'force-dynamic'

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-gray-100 text-gray-700',
  pro: 'bg-blue-100 text-blue-700',
  business: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
}

const upgradePlans = [
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '29€/mês',
    desc: 'Para equipas em crescimento',
    features: ['Até 5 técnicos + 2 gestores', 'Intervenções ilimitadas', 'Relatórios PDF & Excel', 'Notificações por email'],
  },
  {
    id: 'business' as const,
    name: 'Business',
    price: '79€/mês',
    desc: 'Para operações maiores',
    features: ['Até 15 técnicos + 3 gestores', 'Multi-localização', 'Gestão de stock avançada', 'Suporte prioritário'],
  },
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}) {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/login')
  if (profile.role !== 'manager') redirect('/dashboard')

  const params = await searchParams
  const currentPlan = profile.company?.plan ?? 'starter'

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#1B4F72] tracking-tight leading-tight">
          Faturação &<br />Plano
        </h1>
        <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">
          {profile.company?.name} · Gestão de subscrição
        </p>
      </div>

      {params.success === '1' && (
        <div className="mb-6 rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          Subscrição activada com sucesso! O teu plano foi actualizado.
        </div>
      )}
      {params.cancelled === '1' && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-amber-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          Pagamento cancelado. Não foi feita qualquer cobrança.
        </div>
      )}

      {/* Plano atual */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">Plano Atual</p>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#1B4F72]">
                {PLAN_LABELS[currentPlan] ?? currentPlan}
              </h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${PLAN_COLORS[currentPlan] ?? 'bg-gray-100 text-gray-700'}`}>
                {currentPlan === 'starter' ? 'Grátis' : 'Pago'}
              </span>
            </div>
          </div>
          {currentPlan !== 'starter' && currentPlan !== 'enterprise' && (
            <ManageButton />
          )}
        </div>

        {currentPlan === 'starter' && (
          <p className="text-sm text-gray-500">
            Estás no plano gratuito. Faz upgrade para desbloquear mais funcionalidades.
          </p>
        )}
        {currentPlan === 'enterprise' && (
          <p className="text-sm text-gray-500">
            Plano Enterprise activo. Para alterações, contacta o suporte.
          </p>
        )}
        {(currentPlan === 'pro' || currentPlan === 'business') && (
          <p className="text-sm text-gray-500">
            Subscrição activa. Usa o portal de faturação para gerir pagamentos e facturas.
          </p>
        )}
      </div>

      {/* Opções de upgrade */}
      {currentPlan !== 'enterprise' && (
        <div>
          <h2 className="font-bold text-gray-800 text-base uppercase tracking-wide mb-4">
            {currentPlan === 'starter' ? 'Fazer Upgrade' : 'Mudar de Plano'}
          </h2>
          <div className="grid md:grid-cols-2 gap-5">
            {upgradePlans
              .filter((p) => p.id !== currentPlan)
              .map((plan) => (
                <div
                  key={plan.id}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    plan.id === 'pro' ? 'border-[#1B4F72] ring-1 ring-[#1B4F72]/10' : 'border-gray-200'
                  }`}
                >
                  {plan.id === 'pro' && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="h-3.5 w-3.5 text-[#1B4F72] fill-current" />
                      <span className="text-xs font-bold text-[#1B4F72]">Recomendado</span>
                    </div>
                  )}
                  <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 mb-3">{plan.desc}</p>
                  <div className="text-2xl font-black text-[#1B4F72] mb-4">{plan.price}</div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-[#1B4F72] flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <UpgradeButton
                    plan={plan.id}
                    label={`Activar ${plan.name}`}
                    primary={plan.id === 'pro'}
                  />
                </div>
              ))}
          </div>
          <p className="mt-4 text-xs text-gray-400 text-center">
            Todos os planos pagos têm 14 dias de teste grátis. Cancela a qualquer momento. Valores sem IVA.
          </p>
        </div>
      )}
    </div>
  )
}
