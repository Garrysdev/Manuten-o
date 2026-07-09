import type { PlanName } from '@/types/models'

export type FeatureKey = 'assets' | 'history' | 'users' | 'reports' | 'maintenance-plan' | 'calendar' | 'stocks'

export interface PlanLimits {
  maxUsers: number
  interventionsPerMonth: number
  reportsPerMonth: number
}

const GATES: Record<PlanName, Record<FeatureKey, boolean>> = {
  free:       { assets: false, history: false, users: false, reports: true,  'maintenance-plan': false, calendar: false, stocks: false },
  starter:    { assets: true,  history: true,  users: false, reports: true,  'maintenance-plan': false, calendar: true,  stocks: true  },
  pro:        { assets: true,  history: true,  users: true,  reports: true,  'maintenance-plan': true,  calendar: true,  stocks: true  },
  business:   { assets: true,  history: true,  users: true,  reports: true,  'maintenance-plan': true,  calendar: true,  stocks: true  },
  enterprise: { assets: true,  history: true,  users: true,  reports: true,  'maintenance-plan': true,  calendar: true,  stocks: true  },
}

export const LIMITS: Record<PlanName, PlanLimits> = {
  free:       { maxUsers: 2,    interventionsPerMonth: 20,   reportsPerMonth: 1  },
  starter:    { maxUsers: 5,    interventionsPerMonth: 100,  reportsPerMonth: 10 },
  pro:        { maxUsers: 15,   interventionsPerMonth: 500,  reportsPerMonth: 99 },
  business:   { maxUsers: 9999, interventionsPerMonth: 9999, reportsPerMonth: 99 },
  enterprise: { maxUsers: 9999, interventionsPerMonth: 9999, reportsPerMonth: 99 },
}

export const PLAN_LABELS: Record<PlanName, string> = {
  free:       'Free',
  starter:    'Starter',
  pro:        'Pro',
  business:   'Business',
  enterprise: 'Enterprise',
}

const PLAN_ORDER: PlanName[] = ['free', 'starter', 'pro', 'business', 'enterprise']

export function planHas(plan: PlanName, feature: FeatureKey): boolean {
  return GATES[plan]?.[feature] ?? false
}

export function minPlanFor(feature: FeatureKey): PlanName {
  return PLAN_ORDER.find((p) => GATES[p][feature]) ?? 'pro'
}

export const PLAN_UPGRADE_HINT: Record<PlanName, string> = {
  free:       'Disponível no plano Starter',
  starter:    'Disponível no plano Pro',
  pro:        'Disponível no plano Business',
  business:   'Business',
  enterprise: 'Enterprise',
}
