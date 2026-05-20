'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Upload, Plus, Pencil, Trash2, Eye, Search, X, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type Category = { id: string; label_en: string; class_level: number; subject: string; section: string }
type Paper = {
  id: string
  title_en: string
  title_gu: string
  description_en: string
  description_gu: string
  price: number
  paper_count: number
  is_popular: boolean
  is_active: boolean
  category_id: string
  categories: { label_en: string; class_level: number; subject: string; section: string } | null
}

type ModalMode = 'add' | 'edit' | null

const EMPTY_FORM = { title_en: '', title_gu: '', description_en: '', description_gu: '', category_id: '', price: '25', paper_count: '1', is_popular: false }

export default function AdminPapersPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState<ModalMode>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const [papersRes, catsRes] = await Promise.all([
      fetch('/api/admin/papers', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } }),
    ])
    const [papersJson, catsJson] = await Promise.all([papersRes.json(), catsRes.json()])
    if (papersJson.data) setPapers(papersJson.data)
    if (catsJson.data) setCats(catsJson.data)
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const filtered = papers.filter(p =>
    p.title_en.toLowerCase().includes(search.toLowerCase()) ||
    (p.categories?.label_en || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, category_id: cats[0]?.id || '' })
    setFile(null)
    setEditId(null)
    setModal('add')
  }

  const openEdit = (p: Paper) => {
    setForm({
      title_en: p.title_en,
      title_gu: p.title_gu || '',
      description_en: p.description_en || '',
      description_gu: p.description_gu || '',
      category_id: p.category_id,
      price: String(p.price),
      paper_count: String(p.paper_count),
      is_popular: p.is_popular,
    })
    setFile(null)
    setEditId(p.id)
    setModal('edit')
  }

  const handleSave = async () => {
    if (!form.title_en.trim() || !form.category_id) {
      toast.error('Title and subject are required')
      return
    }
    setSaving(true)
    const payload = {
      title_en: form.title_en,
      title_gu: form.title_gu,
      description_en: form.description_en,
      description_gu: form.description_gu,
      category_id: form.category_id,
      price: Number(form.price),
      paper_count: Number(form.paper_count),
      is_popular: form.is_popular,
    }

    let res: Response
    if (modal === 'add') {
      res = await fetch('/api/admin/papers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch(`/api/admin/papers/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    }

    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(modal === 'add' ? 'Paper added!' : 'Paper updated!')
    setModal(null)
    load()
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    const res = await fetch(`/api/admin/papers/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Paper deleted')
    setPapers(p => p.filter(x => x.id !== id))
  }

  const toggleActive = async (p: Paper) => {
    const res = await fetch(`/api/admin/papers/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    setPapers(prev => prev.map(x => x.id === p.id ? { ...x, is_active: !x.is_active } : x))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setFile(f)
    else toast.error('Only PDF files allowed')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Papers</h1>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Paper
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-5 max-w-sm">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search papers..." className="input pl-9" />
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : papers.length === 0 ? (
            <div className="text-center py-20">
              <FileText size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No papers yet. Add one to get started.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {['Title', 'Subject', 'Price', 'Papers', 'Status', 'Actions'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-gray-400 shrink-0" />
                            <div>
                              <p className="font-medium text-gray-800">{p.title_en}</p>
                              {p.is_popular && <span className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full font-semibold">Popular</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-full text-xs font-semibold">
                            {p.categories?.label_en || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">₹{p.price}</td>
                        <td className="px-4 py-3 text-gray-600">{p.paper_count}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleActive(p)}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
                              p.is_active
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            {p.is_active ? 'Active' : 'Hidden'}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500" title="Edit"><Pencil size={14} /></button>
                            <button onClick={() => handleDelete(p.id, p.title_en)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="Delete"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-bold text-gray-900">{modal === 'add' ? 'Add New Paper' : 'Edit Paper'}</h2>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Title (English)</label>
                  <input value={form.title_en} onChange={e => setForm({ ...form, title_en: e.target.value })} className="input" placeholder="JEE Physics Set" />
                </div>
                <div>
                  <label className="label">Title (Gujarati)</label>
                  <input value={form.title_gu} onChange={e => setForm({ ...form, title_gu: e.target.value })} className="input font-gujarati" placeholder="JEE ભૌતિક સેટ" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="label">Subject / Category</label>
                  <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="input">
                    <option value="">— select —</option>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.label_en} (Class {c.class_level})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="input" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">No. of Papers</label>
                  <input type="number" value={form.paper_count} onChange={e => setForm({ ...form, paper_count: e.target.value })} className="input" min="1" />
                </div>
                <div className="flex items-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                    <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Description (EN)</label>
                  <textarea value={form.description_en} onChange={e => setForm({ ...form, description_en: e.target.value })} className="input h-20 resize-none" placeholder="4 full papers..." />
                </div>
                <div>
                  <label className="label">Description (GU)</label>
                  <textarea value={form.description_gu} onChange={e => setForm({ ...form, description_gu: e.target.value })} className="input h-20 resize-none font-gujarati" placeholder="4 સંપૂર્ણ પ્રશ્નપત્રો..." />
                </div>
              </div>

              <div>
                <label className="label">PDF File</label>
                <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-400 bg-brand-50' : 'border-gray-200 hover:border-brand-300'}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('pdf-input')?.click()}
                >
                  <input
                    id="pdf-input" type="file" accept=".pdf" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) setFile(f) }}
                  />
                  <Upload size={24} className="text-gray-400 mx-auto mb-2" />
                  {file ? (
                    <p className="text-sm text-brand-600 font-semibold">{file.name}</p>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600">Drop PDF here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Max 50MB · PDF only</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving...' : modal === 'add' ? 'Add Paper' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
