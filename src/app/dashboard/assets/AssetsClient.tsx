'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, Package, X, Tag, Camera, ImageOff, Upload, Filter, Search } from 'lucide-react'
import { compressImage } from '@/lib/image'
import { uploadImage } from '@/lib/upload'
import type { Asset } from '@/types/models'
import { createAssetAction, updateAssetAction, deleteAssetAction, importAssetsAction } from './actions'
import { useTableSort, SortableTh } from '@/lib/useTableSort'

export default function AssetsClient({ assets }: { assets: Asset[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Asset | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<{ created: number; skipped: number } | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<'all' | 'active' | 'inactive'>('all')

  function openCreate() {
    setCreating(true)
    setPhotoFile(null)
    setPhotoPreview(null)
    setError('')
  }

  function openEdit(asset: Asset) {
    setEditing(asset)
    setPhotoFile(null)
    setPhotoPreview(asset.photoUrl ?? null)
    setError('')
  }

  function closeModal() {
    setEditing(null)
    setCreating(false)
    setError('')
    setPhotoFile(null)
    setPhotoPreview(null)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0]
    if (!original) return
    const file = await compressImage(original) // comprime antes do upload (tarefa 06)
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    let photoFailed = false

    try {
      // A foto NÃO bloqueia a gravação: se o upload ao Storage falhar, o
      // equipamento é guardado na mesma e o utilizador é avisado. (bug 08)
      if (photoFile) {
        try {
          const url = await uploadImage(photoFile, 'assets')
          formData.set('photoUrl', url)
        } catch {
          photoFailed = true
          if (editing?.photoUrl) formData.set('photoUrl', editing.photoUrl)
        }
      } else if (editing?.photoUrl) {
        formData.set('photoUrl', editing.photoUrl)
      }

      const result = editing
        ? await updateAssetAction({}, formData)
        : await createAssetAction({}, formData)

      if (result.error) {
        setError(result.error)
      } else {
        if (photoFailed) {
          setNotice('Equipamento guardado, mas a foto não foi carregada (serviço de imagens indisponível). Podes adicioná-la mais tarde.')
        }
        closeModal()
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao guardar.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Eliminar "${asset.name}"?`)) return
    await deleteAssetAction(asset.id)
    router.refresh()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImporting(true)
    setImportError('')
    setImportResult(null)
    const formData = new FormData()
    formData.set('file', file)
    const result = await importAssetsAction(formData)
    setImporting(false)
    if (result.error) setImportError(result.error)
    else {
      setImportResult({ created: result.created ?? 0, skipped: result.skipped ?? 0 })
      router.refresh()
    }
  }

  const showForm = creating || editing !== null

  const filtered = assets.filter((a) => {
    if (estadoFilter === 'active' && !a.active) return false
    if (estadoFilter === 'inactive' && a.active) return false
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const haystack = [a.name, a.location, a.type, a.area, a.tag, a.manufacturer, ...(a.tags ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  const { sorted: shown, sortKey, sortDir, toggleSort } = useTableSort<Asset>(
    filtered,
    {
      name: (a) => a.name?.toLowerCase(),
      tag: (a) => a.tag?.toLowerCase(),
      area: (a) => a.area?.toLowerCase(),
      location: (a) => a.location,
      type: (a) => a.type,
      active: (a) => (a.active ? 1 : 0),
    },
    null,
  )

  const temFiltro = search.trim() || estadoFilter !== 'all'
  function limparFiltros() { setSearch(''); setEstadoFilter('all') }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipamentos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {shown.length} de {assets.length} equipamento(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" /> {importing ? 'A importar…' : 'Importar'}
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo equipamento
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {importError && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{importError}</span>
          <button onClick={() => setImportError('')} className="text-red-500 hover:text-red-700 flex-shrink-0" aria-label="Dispensar">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {importResult && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <span>
            {importResult.created} equipamento(s) importado(s)
            {importResult.skipped > 0 ? `, ${importResult.skipped} linha(s) ignorada(s)` : ''}.
          </span>
          <button onClick={() => setImportResult(null)} className="text-green-500 hover:text-green-700 flex-shrink-0" aria-label="Dispensar">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-amber-500 hover:text-amber-700 flex-shrink-0" aria-label="Dispensar">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {assets.length > 0 && (
        <div className="card p-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
              <Filter className="h-3.5 w-3.5" /> Filtros
            </span>
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome, localização, tag, área…"
                className="input text-sm py-1.5 pl-7 w-56"
              />
            </div>
            <select value={estadoFilter} onChange={(e) => setEstadoFilter(e.target.value as typeof estadoFilter)} className="input text-sm py-1.5 w-auto">
              <option value="all">Todos os estados</option>
              <option value="active">Ativos</option>
              <option value="inactive">Inativos</option>
            </select>
            {temFiltro && (
              <button onClick={limparFiltros} className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-red-600">
                <X className="h-3.5 w-3.5" /> Limpar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="card">
        {shown.length === 0 ? (
          <div className="px-5 py-12 text-center text-gray-400">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">{temFiltro ? 'Sem equipamentos para estes filtros.' : 'Ainda não há equipamentos. Adiciona o primeiro.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-3 py-3 w-12" />
                <SortableTh label="Nome" sortableKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableTh label="TAG" sortableKey="tag" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell" />
                <SortableTh label="Área" sortableKey="area" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell" />
                <SortableTh label="Localização" sortableKey="location" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden lg:table-cell" />
                <SortableTh label="Estado" sortableKey="active" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5">
                    {a.photoUrl ? (
                      <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <Image src={a.photoUrl} alt={a.name} fill className="object-cover" sizes="36px" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-gray-300" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3.5 font-medium text-gray-800">{a.name}</td>
                  <td className="px-3 py-3.5 text-gray-500 hidden sm:table-cell">
                    {a.tag ? (
                      <span className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                        <Tag className="h-3 w-3" />{a.tag}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-3.5 text-gray-500 hidden md:table-cell">{a.area ?? '—'}</td>
                  <td className="px-3 py-3.5 text-gray-500 hidden lg:table-cell">{a.location ?? '—'}</td>
                  <td className="px-3 py-3.5">
                    <span className={a.active ? 'badge-done' : 'badge-cancelled'}>
                      {a.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <button onClick={() => openEdit(a)} className="text-gray-400 hover:text-[#2E86C1] p-1.5" aria-label="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(a)} className="text-gray-400 hover:text-red-600 p-1.5" aria-label="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="card relative w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? 'Editar equipamento' : 'Novo equipamento'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {editing && <input type="hidden" name="id" value={editing.id} />}

              {/* Foto */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Foto</label>
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#2E86C1] transition-colors overflow-hidden bg-gray-50 flex-shrink-0"
                  >
                    {photoPreview ? (
                      <Image src={photoPreview} alt="preview" width={80} height={80} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Camera className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#2E86C1] hover:underline font-medium block"
                    >
                      {photoPreview ? 'Alterar foto' : 'Carregar foto'}
                    </button>
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                        className="text-red-500 hover:underline text-xs flex items-center gap-1"
                      >
                        <ImageOff className="h-3 w-3" /> Remover
                      </button>
                    )}
                    <p className="text-xs text-gray-400">JPG, PNG — máx. 5 MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
                <input name="name" defaultValue={editing?.name ?? ''} className="input" required placeholder="Ex.: Compressor #1" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">TAG *</label>
                  <input name="tag" defaultValue={editing?.tag ?? ''} className="input" required placeholder="Ex.: 80 F1 B1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Área</label>
                  <input name="area" defaultValue={editing?.area ?? ''} className="input" placeholder="Ex.: 80" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização</label>
                  <input name="location" defaultValue={editing?.location ?? ''} className="input" placeholder="Nave A" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
                  <input name="type" defaultValue={editing?.type ?? ''} className="input" placeholder="Mecânico" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fabricante / Fornecedor</label>
                  <input name="manufacturer" defaultValue={editing?.manufacturer ?? ''} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Nº de série</label>
                  <input name="serialNumber" defaultValue={editing?.serialNumber ?? ''} className="input" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Características</label>
                <textarea name="characteristics" defaultValue={editing?.characteristics ?? ''} className="input" rows={2} placeholder="Detalhes técnicos, capacidade, potência..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (separadas por vírgula)</label>
                <input
                  name="tags"
                  defaultValue={editing?.tags?.join(', ') ?? ''}
                  className="input"
                  placeholder="elétrico, hvac, piso-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas</label>
                <textarea name="notes" defaultValue={editing?.notes ?? ''} className="input" rows={2} />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="active" value="true" defaultChecked={editing?.active ?? true} className="rounded" />
                Ativo
              </label>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700">{error}</div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={busy} className="btn-primary flex-1">
                  {busy ? 'A guardar…' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
