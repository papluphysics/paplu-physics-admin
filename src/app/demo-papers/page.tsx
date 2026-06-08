'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Plus, Trash2, AlertTriangle, ExternalLink, Eye, EyeOff, X, Save } from 'lucide-react'
import toast from 'react-hot-toast'

type ExamCat = { id: string; name: string; type: string }
type DemoPaper = {
  id: string
  title: string
  title_gu: string | null
  description: string | null
  description_gu: string | null
  subject: string
  class_level: string
  exam_category_id: string | null
  pdf_url: string
  is_active: boolean
  created_at: string
}

const EMPTY_FORM = {
  title: '', title_gu: '', description: '', description_gu: '',
  subject: '', exam_category_id: '', pdf_url: '',
}

const SUBJECT_ICONS: Record<string, string> = {
  math: '📐', mathematics: '📐', maths: '📐',
  physics: '⚛️', chemistry: '🧪', biology: '🌿',
  english: '📖', gujarati: '✍️', hindi: '🔤',
  general: '📋', science: '🔬', social: '🌍',
}

function subjectIcon(s: string) {
  return SUBJECT_ICONS[s.toLowerCase()] || '📋'
}

export default function AdminDemoPapersPage() {
  const [papers, setPapers] = useState<DemoPaper[] | null>(null)
  const [examCats, setExamCats] = useState<ExamCat[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const token = () => localStorage.getItem('admin_token')

  const fetchAll = () => {
    const t = token()
    Promise.all([
      fetch('/api/admin/demo-papers', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
      fetch('/api/admin/exam-categories', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
    ]).then(([dp, ec]) => {
      if (!dp.error) setPapers(dp.data)
      if (ec.data) setExamCats(ec.data)
    }).catch(() => {})
  }

  useEffect(() => { fetchAll() }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.pdf_url.trim()) { toast.error('Title and PDF URL are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/demo-papers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success('Demo paper added!')
        setShowForm(false)
        setForm(EMPTY_FORM)
        fetchAll()
      }
    } catch {
      toast.error('Failed to save')
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/demo-papers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Deleted')
        setPapers(p => p ? p.filter(x => x.id !== id) : p)
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch {
      toast.error('Delete failed')
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/demo-papers/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(current ? 'Hidden from demo page' : 'Now visible on demo page')
        setPapers(p => p ? p.map(x => x.id === id ? { ...x, is_active: !current } : x) : p)
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch {
      toast.error('Update failed')
    }
  }

  const standards   = examCats.filter(c => c.type === 'standard')
  const competitive = examCats.filter(c => c.type === 'competitive_exam')

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Demo Papers</h1>
            <p className="text-xs text-gray-400 mt-0.5">Free papers shown on the /demo page — no payment required</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setForm(EMPTY_FORM) }}
            className="btn-primary flex items-center gap-2 px-4 py-2.5 text-sm"
          >
            <Plus size={15} />
            Add Demo Paper
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 text-sm text-green-700">
            <strong>How it works:</strong> Add a paper with a public PDF URL. Students can download it for free from the <code className="bg-green-100 px-1 rounded text-xs">/demo</code> page without logging in.
          </div>

          {showForm && (
            <div className="card p-5 border-brand-200 bg-brand-50/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">Add New Demo Paper</h2>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Title (English) *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className="input"
                      placeholder="e.g. Board Physics Sample Paper"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Title (Gujarati)</label>
                    <input
                      type="text"
                      value={form.title_gu}
                      onChange={e => setForm(f => ({ ...f, title_gu: e.target.value }))}
                      className="input"
                      placeholder="e.g. બોર્ડ ભૌતિક સૅમ્પલ"
                    />
                  </div>
                  <div>
                    <label className="label">Description (English)</label>
                    <input
                      type="text"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className="input"
                      placeholder="e.g. 1 sample paper · Gujarat Board pattern"
                    />
                  </div>
                  <div>
                    <label className="label">Description (Gujarati)</label>
                    <input
                      type="text"
                      value={form.description_gu}
                      onChange={e => setForm(f => ({ ...f, description_gu: e.target.value }))}
                      className="input"
                      placeholder="e.g. ૧ સૅમ્પલ પ્રશ્નપત્ર"
                    />
                  </div>

                  <div>
                    <label className="label">Category</label>
                    <select
                      value={form.exam_category_id}
                      onChange={e => setForm(f => ({ ...f, exam_category_id: e.target.value }))}
                      className="input"
                    >
                      <option value="">— None —</option>
                      {standards.length > 0 && (
                        <optgroup label="Standards">
                          {standards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                      )}
                      {competitive.length > 0 && (
                        <optgroup label="Competitive Exams">
                          {competitive.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="label">Subject <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input
                      type="text"
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      className="input"
                      placeholder="e.g. Physics, Math, Chemistry"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">PDF URL * <span className="text-gray-400 font-normal text-xs">(public direct link)</span></label>
                  <input
                    type="url"
                    value={form.pdf_url}
                    onChange={e => setForm(f => ({ ...f, pdf_url: e.target.value }))}
                    className="input font-mono text-sm"
                    placeholder="https://pub-xxxx.r2.dev/demo/sample.pdf"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Make sure the URL is publicly accessible. Students download directly from this link.</p>
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={saving || !form.title.trim() || !form.pdf_url.trim()}
                    className="btn-primary flex items-center gap-2 px-5 py-2.5 disabled:opacity-50"
                  >
                    {saving ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                    ) : (
                      <><Save size={15} /> Add Demo Paper</>
                    )}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn-outline px-4 py-2.5 text-sm">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {papers === null ? (
            <div className="card p-8 text-center text-gray-400 text-sm">Loading...</div>
          ) : papers.length === 0 ? (
            <div className="card p-10 text-center">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-gray-600 font-medium mb-1">No demo papers yet</p>
              <p className="text-sm text-gray-400 mb-4">Add your first free demo paper so students can preview quality before buying.</p>
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2 px-5 py-2.5 mx-auto text-sm">
                <Plus size={14} /> Add First Demo Paper
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {papers.map(paper => (
                <div
                  key={paper.id}
                  className={`card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${!paper.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl shrink-0">
                      {subjectIcon(paper.subject)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{paper.title}</span>
                        {paper.title_gu && <span className="text-xs text-gray-400">· {paper.title_gu}</span>}
                        {!paper.is_active && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {paper.subject && <span className="text-xs text-gray-400 capitalize">{paper.subject}</span>}
                        {paper.class_level && (
                          <>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{paper.class_level}</span>
                          </>
                        )}
                        {paper.description && (
                          <>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400 truncate max-w-xs">{paper.description}</span>
                          </>
                        )}
                      </div>
                      {paper.pdf_url && (
                        <a
                          href={paper.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-brand-500 hover:underline flex items-center gap-1 mt-1 truncate max-w-sm"
                        >
                          <ExternalLink size={10} />
                          {paper.pdf_url.slice(0, 60)}{paper.pdf_url.length > 60 ? '…' : ''}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggle(paper.id, paper.is_active)}
                      title={paper.is_active ? 'Hide from demo page' : 'Show on demo page'}
                      className={`p-2 rounded-xl transition-colors ${
                        paper.is_active
                          ? 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {paper.is_active ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>

                    {confirmDelete === paper.id ? (
                      <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                        <AlertTriangle size={13} className="text-red-500 shrink-0" />
                        <span className="text-xs text-red-600 font-medium">Delete?</span>
                        <button
                          onClick={() => handleDelete(paper.id)}
                          disabled={deleting === paper.id}
                          className="text-xs font-bold text-red-600 hover:text-red-800 ml-1"
                        >
                          {deleting === paper.id ? '...' : 'Yes'}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(paper.id)}
                        className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete permanently"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
