// Acesso a dados (servidor) via Admin SDK. Todas as queries são scoped por companyId.
import 'server-only'
import type { DocumentSnapshot } from 'firebase-admin/firestore'
import { adminDb, adminAuth } from './admin'
import type { Asset, Task, User, Intervention, Material, Invite, UserRole, MaintenancePlan, StockItem, TaskCriticidade, Periodicidade, Executor } from '@/types/models'

function serialize<T>(doc: DocumentSnapshot): T {
  return { id: doc.id, ...doc.data() } as T
}

// ── ASSETS ──────────────────────────────────────────────────────────────────
export async function listAssets(companyId: string): Promise<Asset[]> {
  const snap = await adminDb()
    .collection('assets')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs
    .map((d) => serialize<Asset>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Versão LEVE: só id+name (para dropdowns e mapa id→nome). Evita trazer o doc inteiro. */
export async function listAssetRefs(companyId: string): Promise<{ id: string; name: string }[]> {
  const snap = await adminDb()
    .collection('assets')
    .where('companyId', '==', companyId)
    .select('name')
    .get()
  return snap.docs
    .map((d) => ({ id: d.id, name: (d.data().name as string) ?? '' }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/** Refs LEVES de planos para o modal de criação de tarefas (só os campos usados, ativos com equipamento). */
export type PlanTaskRef = {
  id: string
  title: string
  assetId: string | null
  criticidade: TaskCriticidade
  periodicidade: Periodicidade | null
  periodicidadeLabel: string | null
  executor: Executor | null
  legal: boolean
  months: string | null
  safetyRules: string[] | null
}
export async function listPlanTaskRefs(companyId: string): Promise<PlanTaskRef[]> {
  const snap = await adminDb()
    .collection('maintenance_plans')
    .where('companyId', '==', companyId)
    .select('title', 'assetId', 'criticidade', 'periodicidade', 'periodicidadeLabel', 'executor', 'legal', 'months', 'safetyRules', 'active')
    .get()
  return snap.docs
    .filter((d) => d.data().active !== false && d.data().assetId)
    .map((d) => {
      const x = d.data()
      return {
        id: d.id,
        title: x.title ?? '',
        assetId: x.assetId ?? null,
        criticidade: x.criticidade ?? 'verde',
        periodicidade: x.periodicidade ?? null,
        periodicidadeLabel: x.periodicidadeLabel ?? null,
        executor: x.executor ?? null,
        legal: x.legal ?? false,
        months: x.months ?? null,
        safetyRules: x.safetyRules ?? null,
      }
    })
}

export async function getAsset(companyId: string, id: string): Promise<Asset | null> {
  const doc = await adminDb().collection('assets').doc(id).get()
  if (!doc.exists || doc.data()?.companyId !== companyId) return null
  return serialize<Asset>(doc)
}

export async function createAsset(
  companyId: string,
  data: Omit<Asset, 'id' | 'companyId' | 'createdAt'>
): Promise<string> {
  const ref = await adminDb()
    .collection('assets')
    .add({ ...data, companyId, createdAt: new Date().toISOString() })
  return ref.id
}

export async function updateAsset(
  companyId: string,
  id: string,
  data: Partial<Omit<Asset, 'id' | 'companyId' | 'createdAt'>>
): Promise<void> {
  const ref = adminDb().collection('assets').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Ativo não encontrado')
  await ref.update(data)
}

export async function deleteAsset(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('assets').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Ativo não encontrado')
  await ref.delete()
}

// ── TASKS ───────────────────────────────────────────────────────────────────
export async function listTasks(companyId: string): Promise<Task[]> {
  const snap = await adminDb()
    .collection('tasks')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs
    .map((d) => serialize<Task>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getTask(companyId: string, id: string): Promise<Task | null> {
  const doc = await adminDb().collection('tasks').doc(id).get()
  if (!doc.exists || doc.data()?.companyId !== companyId) return null
  return serialize<Task>(doc)
}

export async function createTask(
  companyId: string,
  createdBy: string,
  data: Omit<Task, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy'>
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await adminDb()
    .collection('tasks')
    .add({ ...data, companyId, createdBy, createdAt: now, updatedAt: now })
  return ref.id
}

export async function updateTask(
  companyId: string,
  id: string,
  data: Partial<Omit<Task, 'id' | 'companyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const ref = adminDb().collection('tasks').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Tarefa não encontrada')
  await ref.update({ ...data, updatedAt: new Date().toISOString() })
}

export async function deleteTask(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('tasks').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Tarefa não encontrada')
  await ref.delete()
}

// ── USERS (para atribuição de tarefas) ────────────────────────────────────────
export async function listUsers(companyId: string): Promise<User[]> {
  const snap = await adminDb()
    .collection('users')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs.map((d) => serialize<User>(d))
}

// ── REGISTO (cria empresa + gestor) ───────────────────────────────────────────
export async function createCompanyWithManager(
  uid: string,
  email: string,
  data: { companyName: string; userName: string }
): Promise<{ companyId: string }> {
  const db = adminDb()
  const now = new Date().toISOString()

  // slug simples a partir do nome da empresa
  const baseSlug = data.companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'empresa'
  const slug = `${baseSlug}-${uid.slice(0, 6)}`

  const companyRef = db.collection('companies').doc()
  await companyRef.set({
    name: data.companyName.trim(),
    slug,
    plan: 'free',
    maxTechnicians: 1,
    logoUrl: null,
    createdAt: now,
  })

  await db.collection('users').doc(uid).set({
    companyId: companyRef.id,
    email,
    name: data.userName.trim(),
    role: 'manager',
    avatarUrl: null,
    active: true,
    createdAt: now,
  })

  return { companyId: companyRef.id }
}

// ── INTERVENTIONS (execução / histórico) ──────────────────────────────────────
export async function listInterventions(companyId: string): Promise<Intervention[]> {
  const snap = await adminDb()
    .collection('interventions')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs
    .map((d) => serialize<Intervention>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function listInterventionsByTask(
  companyId: string,
  taskId: string
): Promise<Intervention[]> {
  const snap = await adminDb()
    .collection('interventions')
    .where('companyId', '==', companyId)
    .where('taskId', '==', taskId)
    .get()
  const items = snap.docs.map((d) => serialize<Intervention>(d))
  // ordena por createdAt desc em memória (evita índice composto extra)
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
}

export async function createIntervention(
  companyId: string,
  data: Omit<Intervention, 'id' | 'companyId' | 'createdAt'>
): Promise<string> {
  const ref = await adminDb()
    .collection('interventions')
    .add({ ...data, companyId, createdAt: new Date().toISOString() })
  return ref.id
}

export async function deleteIntervention(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('interventions').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId)
    throw new Error('Intervenção não encontrada')
  await ref.delete()
}

// ── MATERIALS ─────────────────────────────────────────────────────────────────
export async function listMaterialsForInterventions(
  companyId: string,
  interventionIds: string[]
): Promise<Material[]> {
  if (interventionIds.length === 0) return []
  const chunks: string[][] = []
  for (let i = 0; i < interventionIds.length; i += 10)
    chunks.push(interventionIds.slice(i, i + 10))
  const results = await Promise.all(
    chunks.map((chunk) =>
      adminDb()
        .collection('materials')
        .where('companyId', '==', companyId)
        .where('interventionId', 'in', chunk)
        .get()
        .then((snap) => snap.docs.map((d) => serialize<Material>(d)))
    )
  )
  return results.flat()
}

export async function createMaterial(
  companyId: string,
  data: Omit<Material, 'id' | 'companyId' | 'createdAt'>
): Promise<string> {
  const ref = await adminDb()
    .collection('materials')
    .add({ ...data, companyId, createdAt: new Date().toISOString() })
  return ref.id
}

export async function deleteMaterial(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('materials').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId)
    throw new Error('Material não encontrado')
  await ref.delete()
}

// ── INVITES ───────────────────────────────────────────────────────────────────
export async function createInviteToken(
  companyId: string,
  role: UserRole,
  email?: string
): Promise<{ id: string; token: string }> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const ref = await adminDb().collection('invites').add({
    companyId,
    role,
    token,
    used: false,
    email: email ?? null,
    expiresAt,
    createdAt: new Date().toISOString(),
  })
  return { id: ref.id, token }
}

export async function getInviteByToken(token: string, callerEmail?: string): Promise<Invite | null> {
  const snap = await adminDb()
    .collection('invites')
    .where('token', '==', token)
    .limit(1)
    .get()
  if (snap.empty) return null
  const invite = serialize<Invite>(snap.docs[0])
  if (invite.used) return null
  if (invite.expiresAt && invite.expiresAt < new Date().toISOString()) return null
  if (invite.email && callerEmail && invite.email.toLowerCase() !== callerEmail.toLowerCase()) return null
  return invite
}

export async function markInviteUsed(id: string): Promise<void> {
  await adminDb().collection('invites').doc(id).update({ used: true })
}

// ── GESTÃO DE UTILIZADORES ─────────────────────────────────────────────────────
export async function createUserFromInvite(
  uid: string,
  email: string,
  name: string,
  companyId: string,
  role: UserRole
): Promise<void> {
  await adminDb().collection('users').doc(uid).set({
    companyId,
    email,
    name: name.trim(),
    role,
    avatarUrl: null,
    active: true,
    createdAt: new Date().toISOString(),
  })
}

export async function deactivateUser(companyId: string, userId: string): Promise<void> {
  const ref = adminDb().collection('users').doc(userId)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId)
    throw new Error('Utilizador não encontrado')
  await ref.update({ active: false })
  // Bloqueia a conta Firebase Auth e revoga todos os tokens
  await adminAuth().updateUser(userId, { disabled: true })
  await adminAuth().revokeRefreshTokens(userId)
}

export async function getCompanyName(companyId: string): Promise<string | null> {
  const doc = await adminDb().collection('companies').doc(companyId).get()
  return doc.exists ? ((doc.data()?.name as string) ?? null) : null
}

export async function createUserDirect(
  companyId: string,
  data: { email: string; name: string; role: UserRole; tempPassword: string }
): Promise<string> {
  const authUser = await adminAuth().createUser({
    email: data.email,
    password: data.tempPassword,
    displayName: data.name,
  })
  await adminDb().collection('users').doc(authUser.uid).set({
    companyId,
    email: data.email,
    name: data.name.trim(),
    role: data.role,
    avatarUrl: null,
    active: true,
    createdAt: new Date().toISOString(),
  })
  return authUser.uid
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string; avatarUrl?: string | null }
): Promise<void> {
  const update: Record<string, unknown> = {}
  if (data.name !== undefined) update.name = data.name.trim()
  if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl
  await adminDb().collection('users').doc(userId).update(update)
}

export async function countActiveUsers(companyId: string): Promise<number> {
  const users = await listUsers(companyId)
  return users.filter((u) => u.active).length
}

export async function countInterventionsThisMonth(companyId: string): Promise<number> {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const all = await listInterventions(companyId)
  return all.filter((i) => i.createdAt >= startOfMonth).length
}

export async function listInterventionsByTechnician(
  companyId: string,
  technicianId: string
): Promise<Intervention[]> {
  const all = await listInterventions(companyId)
  return all.filter((i) => i.technicianId === technicianId)
}

// ── MAINTENANCE PLANS ─────────────────────────────────────────────────────────

export async function listMaintenancePlans(companyId: string): Promise<MaintenancePlan[]> {
  const snap = await adminDb()
    .collection('maintenance_plans')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs
    .map((d) => serialize<MaintenancePlan>(d))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getMaintenancePlan(companyId: string, id: string): Promise<MaintenancePlan | null> {
  const doc = await adminDb().collection('maintenance_plans').doc(id).get()
  if (!doc.exists || doc.data()?.companyId !== companyId) return null
  return serialize<MaintenancePlan>(doc)
}

export async function createMaintenancePlan(
  companyId: string,
  createdBy: string,
  data: Omit<MaintenancePlan, 'id' | 'companyId' | 'createdBy' | 'createdAt' | 'updatedAt' | 'lastGeneratedAt'>
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await adminDb()
    .collection('maintenance_plans')
    .add({ ...data, companyId, createdBy, createdAt: now, updatedAt: now, lastGeneratedAt: null })
  return ref.id
}

export async function updateMaintenancePlan(
  companyId: string,
  id: string,
  data: Partial<Omit<MaintenancePlan, 'id' | 'companyId' | 'createdBy' | 'createdAt'>>
): Promise<void> {
  const ref = adminDb().collection('maintenance_plans').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Plano não encontrado')
  await ref.update({ ...data, updatedAt: new Date().toISOString() })
}

export async function deleteMaintenancePlan(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('maintenance_plans').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Plano não encontrado')
  await ref.delete()
}

export async function getUsersByCompany(companyId: string): Promise<User[]> {
  return listUsers(companyId)
}

// ── STOCK ITEMS ───────────────────────────────────────────────────────────────

export async function listStockItems(companyId: string): Promise<StockItem[]> {
  const snap = await adminDb()
    .collection('stock_items')
    .where('companyId', '==', companyId)
    .get()
  return snap.docs
    .map((d) => serialize<StockItem>(d))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function createStockItem(
  companyId: string,
  data: Omit<StockItem, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await adminDb()
    .collection('stock_items')
    .add({ ...data, companyId, createdAt: now, updatedAt: now })
  return ref.id
}

export async function updateStockItem(
  companyId: string,
  id: string,
  data: Partial<Omit<StockItem, 'id' | 'companyId' | 'createdAt'>>
): Promise<void> {
  const ref = adminDb().collection('stock_items').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Item não encontrado')
  await ref.update({ ...data, updatedAt: new Date().toISOString() })
}

export async function deleteStockItem(companyId: string, id: string): Promise<void> {
  const ref = adminDb().collection('stock_items').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) throw new Error('Item não encontrado')
  await ref.delete()
}

export async function decrementStockQuantity(
  companyId: string,
  id: string,
  qty: number
): Promise<void> {
  const { FieldValue } = await import('firebase-admin/firestore')
  const ref = adminDb().collection('stock_items').doc(id)
  const doc = await ref.get()
  if (!doc.exists || doc.data()?.companyId !== companyId) return
  await ref.update({
    quantity: FieldValue.increment(-qty),
    updatedAt: new Date().toISOString(),
  })
}
