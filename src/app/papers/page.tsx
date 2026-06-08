'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Upload, Plus, Pencil, Trash2, Search, X, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

type Category = { id: string; label_en: string; class_level: string; subject: string; section: string }
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
  is_demo: boolean
  marking_scheme: string | null
  category_id: string
  categories: { label_en: string; class_level: string; subject: string; section: string } | null
}

type ModalMode = 'add' | 'edit' | null

const EMPTY_FORM = {
  title_en: '', title_gu: '',
  description_en: '', description_gu: '',
  class_level: '', subject: '', section: '',
  price: '25', paper_count: '1', is_popular: false, is_demo: false,
  marking_scheme: '',
}

function Combobox({ label, value, onChange, options, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const suggestions = options.filter(o =>
    o.toLowerCase().includes(value.toLowerCase()) &&
    o.toLowerCase() !== value.toLowerCase()
  )
  return (
    <div className="relative">
      <label className="label">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); onChange(value.trim()) }, 150)}
        onKeyDown={e => e.key === 'Escape' && setOpen(false)}
        placeholder={placeholder}
        className="input"
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
    if (catsJson.data) setCats(catsJson.data.map((c: any) => ({ ...c, class_level: String(c.class_level) })))
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const distinctClasses  = [...new Set(cats.map(c => c.class_level))].sort()
  const distinctSubjects = [...new Set(cats.map(c => c.subject))].sort()
  const distinctSections = [...new Set(cats.map(c => c.section))].sort()

  const filtered = papers.filter(p =>
    p.title_en.toLowerCase().includes(search.toLowerCase()) ||
    (p.categories?.label_en || '').toLowerCase().includes(search.toLowerCase())
  )

  const openAdd = () => {
    setForm(EMPTY_FORM)
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
      class_level: p.categories ? String(p.categories.class_level) : '',
      subject: p.categories?.subject || '',
      section: p.categories?.section || '',
      price: String(p.price),
      paper_count: String(p.paper_count),
      is_popular: p.is_popular,
      is_demo: p.is_demo,
      marking_scheme: p.marking_scheme || '',
    })
    setFile(null)
    setEditId(p.id)
    setModal('edit')
  }

  const handleSave = async () => {
    const cl = form.class_level.trim()
    const sub = form.subject.trim()
    const sec = form.section.trim()

    if (!form.title_en.trim()) { toast.error('Title is required'); return }
    if (!cl || !sub || !sec) { toast.error('Class, Subject, and Exam Type are required'); return }

    setSaving(true)

    // Find existing category (case-insensitive match on all three fields)
    let categoryId: string | undefined = cats.find(c =>
      c.class_level.toLowerCase() === cl.toLowerCase() &&
      c.subject.toLowerCase() === sub.toLowerCase() &&
      c.section.toLowerCase() === sec.toLowerCase()
    )?.id

    // Create category on-the-fly if it doesn't exist
    if (!categoryId) {
      const capFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
      const label_en = `Class ${cl} ${capFirst(sub)} (${sec.toUpperCase()})`
      const catRes = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ class_level: cl, subject: sub, section: sec, label_en, label_gu: label_en }),
      })
      const catJson = await catRes.json()
      if (catJson.error) { toast.error(`Could not create category: ${catJson.error}`); setSaving(false); return }
      categoryId = catJson.data.id
      // Refresh cats list in background so suggestions stay current
      setCats(prev => [...prev, { id: categoryId!, class_level: cl, subject: sub, section: sec, label_en }])
    }

    const payload = {
      title_en: form.title_en,
      title_gu: form.title_gu,
      description_en: form.description_en,
      description_gu: form.description_gu,
      category_id: categoryId,
      price: Number(form.price),
      paper_count: Number(form.paper_count),
      is_popular: form.is_popular,
      is_demo: form.is_demo,
      marking_scheme: form.marking_scheme.trim() || null,
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
                      {['Title', 'Subject', 'Price', 'Papers', 'Demo', 'Status', 'Actions'].map(h => (
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
                          {p.is_demo && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold">Demo</span>
                          )}
                        </td>
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

              <div className="grid grid-cols-2 gap-3">
                <Combobox
                  label="Class / Standard"
                  value={form.class_level}
                  onChange={v => setForm({ ...form, class_level: v })}
                  options={distinctClasses}
                  placeholder="e.g. 10, 12, 11"
                />
                <Combobox
                  label="Subject"
                  value={form.subject}
                  onChange={v => setForm({ ...form, subject: v })}
                  options={distinctSubjects}
                  placeholder="e.g. physics, math"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Combobox
                    label="Exam Type / Section"
                    value={form.section}
                    onChange={v => setForm({ ...form, section: v })}
                    options={distinctSections}
                    placeholder="e.g. jee, neet, pass, 75"
                  />
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
                <div className="flex flex-col gap-2 justify-end pb-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm({ ...form, is_popular: e.target.checked })} className="w-4 h-4 accent-brand-500" />
                    <span className="text-sm font-medium text-gray-700">Mark as Popular</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_demo} onChange={e => setForm({ ...form, is_demo: e.target.checked })} className="w-4 h-4 accent-green-500" />
                    <span className="text-sm font-medium text-green-700">Free Demo Paper</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="label">Marking Scheme <span className="text-gray-400 font-normal">(optional)</span></label>
                <textarea
                  value={form.marking_scheme}
                  onChange={e => setForm({ ...form, marking_scheme: e.target.value })}
                  className="input h-16 resize-none"
                  placeholder="e.g. 30 MCQ × 1 mark, 5 long-answer × 5 marks, total 55 marks"
                />
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
