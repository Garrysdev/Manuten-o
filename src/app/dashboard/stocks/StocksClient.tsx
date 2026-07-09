'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, X, AlertTriangle, Boxes } from 'lucide-react'
import type { StockItem } from '@/types/models'
import { createStockItemAction, updateStockItemAction, deleteStockItemAction } from './actions'

type ModalMode = { type: 'create' } | { type: 'edit'; item: StockItem }

function StockForm({
  defaultValues,
  onSave,
  onCancel,
}: {
  defaultValues?: Partial<StockItem>
  onSave: (formData: FormData) => Promise<void>
  onCancel: () => void
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSave(new FormData(e.currentTarget))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
          <input name="name" defaultValue={defaultValues?.name ?? ''} className="input" placeholder="Ex: Óleo lubrificante 5W-30" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Referência</label>
          <input name="reference" defaultValue={defaultValues?.reference ?? ''} className="input" placeholder="REF-001" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Categoria</label>
          <input name="category" defaultValue={defaultValues?.category ?? ''} className="input" placeholder="Lubrificantes" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantidade</label>
          <input name="quantity" type="number" min="0" step="0.01" defaultValue={defaultValues?.quantity ?? 0} className="input" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade</label>
          <input name="unit" defaultValue={defaultValues?.unit ?? ''} className="input" placeholder="L, un, kg…" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Custo unitário (€)</label>
          <input name="unitCost" type="number" min="0" step="0.01" defaultValue={defaultValues?.unitCost ?? ''} className="input" placeholder="0.00" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Qtd. mínima (alerta)</label>
          <input name="minQuantity" type="number" min="0" step="0.01" defaultValue={defaultValues?.minQuantity ?? ''} className="input" placeholder="Ex: 5" />
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização</label>
          <input name="location" defaultValue={defaultValues?.location ?? ''} className="input" placeholder="Armazém A, Prateleira 3…" />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {busy ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}

export default function StocksClient({ items }: { items: StockItem[] }) {
  const router = useRouter()
  const [modal, setModal] = useState<ModalMode | null>(null)

  async function handleCreate(formData: FormData) {
    const result = await createStockItemAction({}, formData)
    if (result.error) throw new Error(result.error)
    setModal(null)
    router.refresh()
  }

  async function handleEdit(id: string, formData: FormData) {
    const result = await updateStockItemAction(id, {}, formData)
    if (result.error) throw new Error(result.error)
    setModal(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminar este item do stock?')) return
    await deleteStockItemAction(id)
    router.refresh()
  }

  const lowStock = items.filter((i) => i.minQuantity != null && i.quantity <= i.minQuantity)

  return (
    <div>
      {lowStock.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Stocks abaixo do mínimo</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {lowStock.map((i) => i.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800">
          {items.length} {items.length === 1 ? 'item' : 'itens'}
        </h2>
        <button
          onClick={() => setModal({ type: 'create' })}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Novo item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="card px-5 py-12 text-center text-gray-400">
          <Boxes className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Sem itens em stock. Adiciona o primeiro item.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Ref.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Categoria</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Qtd.</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden md:table-cell">Un.</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden lg:table-cell">Custo/un</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide hidden xl:table-cell">Local</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item) => {
                  const isLow = item.minQuantity != null && item.quantity <= item.minQuantity
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        {isLow && (
                          <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                            <AlertTriangle className="h-2.5 w-2.5" /> stock baixo
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.reference ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{item.category ?? '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isLow ? 'text-amber-600' : 'text-gray-800'}`}>
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.unit ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden lg:table-cell">
                        {item.unitCost != null ? `${item.unitCost.toFixed(2)} €` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden xl:table-cell">{item.location ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setModal({ type: 'edit', item })}
                            className="p-1.5 text-gray-400 hover:text-[#2E86C1] transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            aria-label="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setModal(null)} />
          <div className="card relative w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {modal.type === 'create' ? 'Novo item de stock' : 'Editar item'}
              </h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {modal.type === 'create' ? (
              <StockForm onSave={handleCreate} onCancel={() => setModal(null)} />
            ) : (
              <StockForm
                defaultValues={modal.item}
                onSave={(fd) => handleEdit(modal.item.id, fd)}
                onCancel={() => setModal(null)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
