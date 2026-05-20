'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Plus, Trash2, X, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

type Category = {
  id: string
  class_level: number
  subject: string
  section: string
  label_en: string
  label_gu: string
}

const EMPTY_FORM = { class_level: '10', subject: '', section: 'pass', label_en: '', label_gu: '' }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.data) setCats(json.data)
    else toast.error(json.error || 'Failed to load')
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const openAdd = () => { setForm(EMPTY_FORM); setModal(true) }

  const handleSave = async () => {
    if (!form.subject.trim() || !form.label_en.trim() || !form.label_gu.trim()) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, class_level: Number(form.class_level) }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success('Subject added!')
    setModal(false)
    load()
  }

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Delete "${label}"? Papers using it must be removed first.`)) return
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Subject deleted')
    setCats(c => c.filter(x => x.id !== id))
  }

  const grouped = cats.reduce<Record<string, Category[]>>((acc, c) => {
    const key = `Class ${c.class_level}`
    acc[key] = [...(acc[key] || []), c]
    return acc
  }, {})

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Subjects / Categories</h1>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Add Subject
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading...</div>
          ) : cats.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No subjects yet. Add one to get started.</p>
            </div>
          ) : (
            Object.entries(grouped).sort().map(([group, items]) => (
              <div key={group} className="card overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700 text-sm">{group}</h2>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map(c => (
                    <div key={c.id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{c.label_en}</p>
                        <p className="text-xs text-gray-400 mt-0.5 font-gujarati">{c.label_gu}</p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">{c.subject}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full font-semibold">{c.section}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(c.id, c.label_en)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Add Subject</h2>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class</label>
                  <select value={form.class_level} onChange={e => setForm({ ...form, class_level: e.target.value })} className="input">
                    <option value="10">Class 10</option>
                    <option value="12">Class 12</option>
                  </select>
                </div>
                <div>
                  <label className="label">Subject (key)</label>
                  <input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input" placeholder="physics" />
                </div>
              </div>
              <div>
                <label className="label">Section / Category</label>
                <select value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="input">
                  <option value="pass">To Get Pass</option>
                  <option value="75">Above 75%</option>
                  <option value="90">Above 90%</option>
                  <option value="jee">JEE</option>
                  <option value="neet">NEET</option>
                  <option value="gujcet">GUJCET</option>
                </select>
              </div>
              <div>
                <label className="label">Label (English)</label>
                <input value={form.label_en} onChange={e => setForm({ ...form, label_en: e.target.value })} className="input" placeholder="JEE Physics Set" />
              </div>
              <div>
                <label className="label">Label (Gujarati)</label>
                <input value={form.label_gu} onChange={e => setForm({ ...form, label_gu: e.target.value })} className="input font-gujarati" placeholder="JEE ભૌતિક સેટ" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setModal(false)} className="btn-ghost flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving...' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
