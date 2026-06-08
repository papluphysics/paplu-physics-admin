'use client'
import { useState, useEffect, useCallback } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Plus, Pencil, Trash2, X, Check, BookOpen, Trophy } from 'lucide-react'
import toast from 'react-hot-toast'

type ExamCategory = { id: string; name: string; type: 'standard' | 'competitive_exam'; created_at: string }

function CategorySection({
  title, icon: Icon, color, type, items, token,
  onRefresh,
}: {
  title: string
  icon: React.ElementType
  color: string
  type: 'standard' | 'competitive_exam'
  items: ExamCategory[]
  token: string
  onRefresh: () => void
}) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setSaving(true)
    const res = await fetch('/api/admin/exam-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name, type }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(`${title.slice(0, -1)} added!`)
    setNewName(''); setAdding(false)
    onRefresh()
  }

  const handleEdit = async (id: string) => {
    const name = editName.trim()
    if (!name) return
    const res = await fetch(`/api/admin/exam-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Updated')
    setEditId(null)
    onRefresh()
  }

  const handleDelete = async (item: ExamCategory) => {
    if (!confirm(`Delete "${item.name}"? Any papers using it will lose this category link.`)) return
    const res = await fetch(`/api/admin/exam-categories/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Deleted')
    onRefresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className={`px-5 py-4 flex items-center justify-between border-b border-gray-100 ${color}`}>
        <div className="flex items-center gap-2">
          <Icon size={18} />
          <h2 className="font-bold text-base">{title}</h2>
          <span className="text-xs opacity-70 font-normal">({items.length})</span>
        </div>
        <button
          onClick={() => { setAdding(true); setNewName('') }}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/70 hover:bg-white transition-colors"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {/* Add row */}
      {adding && (
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false) }}
            placeholder={type === 'standard' ? 'e.g. Class 11, Class 8…' : 'e.g. MHT-CET, KVPY…'}
            className="input flex-1 text-sm py-2"
          />
          <button onClick={handleAdd} disabled={saving || !newName.trim()} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-40">
            <Check size={14} />
          </button>
          <button onClick={() => setAdding(false)} className="p-2 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300">
            <X size={14} />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">
          No {title.toLowerCase()} yet — click Add to create one
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between px-5 py-3">
              {editId === item.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    autoFocus
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEdit(item.id); if (e.key === 'Escape') setEditId(null) }}
                    className="input flex-1 text-sm py-1.5"
                  />
                  <button onClick={() => handleEdit(item.id)} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600">
                    <Check size={13} />
                  </button>
                  <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600">
                    <X size={13} />
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditId(item.id); setEditName(item.name) }}
                      className="p-1.5 hover:bg-amber-50 rounded-lg text-amber-500"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ExamCategory[]>([])
  const [loading, setLoading] = useState(true)
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : ''

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/exam-categories', { headers: { Authorization: `Bearer ${token}` } })
    const json = await res.json()
    if (json.data) setCategories(json.data)
    else toast.error(json.error || 'Failed to load')
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  const standards     = categories.filter(c => c.type === 'standard')
  const competitive   = categories.filter(c => c.type === 'competitive_exam')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
          <h1 className="font-bold text-gray-900 text-lg">Categories</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage Standards and Competitive Exams that papers are grouped under</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-20 text-gray-400">Loading…</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <CategorySection
                title="Standards"
                icon={BookOpen}
                color="bg-blue-50 text-blue-700"
                type="standard"
                items={standards}
                token={token}
                onRefresh={load}
              />
              <CategorySection
                title="Competitive Exams"
                icon={Trophy}
                color="bg-amber-50 text-amber-700"
                type="competitive_exam"
                items={competitive}
                token={token}
                onRefresh={load}
              />
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-xl text-xs text-gray-500">
            <strong>How it works:</strong> Standards are class-based (Class 10, 12, 11…). Competitive Exams are entrance-based (JEE, NEET…). When you create or edit a paper, you pick one of these categories to group it under. The /papers and /demo pages dynamically show these groups as tappable category cards.
          </div>
        </div>
      </main>
    </div>
  )
}
