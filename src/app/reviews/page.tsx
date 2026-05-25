'use client'
import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import { Star, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

type Review = {
  id: string
  user_name: string
  city: string | null
  rating: number
  text: string
  approved: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'approved' | 'hidden'>('all')

  const fetchReviews = () => {
    const token = localStorage.getItem('admin_token')
    fetch('/api/admin/reviews', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (!d.error) setReviews(d.data) })
      .catch(() => {})
  }

  useEffect(() => { fetchReviews() }, [])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Review deleted permanently')
        setReviews(prev => prev ? prev.filter(r => r.id !== id) : prev)
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch {
      toast.error('Delete failed')
    }
    setDeleting(null)
    setConfirmDelete(null)
  }

  const handleToggleApproval = async (id: string, approved: boolean) => {
    const token = localStorage.getItem('admin_token')
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: !approved }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(approved ? 'Review hidden from public' : 'Review made visible')
        setReviews(prev => prev ? prev.map(r => r.id === id ? { ...r, approved: !approved } : r) : prev)
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch {
      toast.error('Update failed')
    }
  }

  const filtered = reviews === null ? null : (
    filter === 'all' ? reviews
    : filter === 'approved' ? reviews.filter(r => r.approved)
    : reviews.filter(r => !r.approved)
  )

  const totalApproved = reviews ? reviews.filter(r => r.approved).length : 0
  const avgRating = reviews && reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="font-bold text-gray-900 text-lg">Student Reviews</h1>
            <p className="text-xs text-gray-400 mt-0.5">Manage and moderate public reviews</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Avg Rating</p>
              <p className="font-bold text-gray-900 flex items-center gap-1">
                {avgRating}
                <Star size={12} fill="#fbbf24" className="text-amber-400" />
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Reviews', value: reviews ? reviews.length : '—', color: 'text-gray-900' },
              { label: 'Visible (Approved)', value: totalApproved, color: 'text-green-600' },
              { label: 'Hidden', value: reviews ? reviews.length - totalApproved : '—', color: 'text-amber-600' },
            ].map(m => (
              <div key={m.label} className="card p-4">
                <p className={`font-bold text-2xl ${m.color}`}>{m.value}</p>
                <p className="text-xs text-gray-500 mt-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            {(['all', 'approved', 'hidden'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  filter === f
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                }`}
              >
                {f === 'all' ? 'All' : f === 'approved' ? 'Visible' : 'Hidden'}
              </button>
            ))}
          </div>

          {/* Reviews table */}
          {filtered === null ? (
            <div className="card p-8 text-center text-gray-400 text-sm">Loading reviews...</div>
          ) : filtered.length === 0 ? (
            <div className="card p-8 text-center text-gray-400 text-sm">No reviews found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(r => (
                <div
                  key={r.id}
                  className={`card p-4 transition-all ${!r.approved ? 'opacity-60 bg-gray-50' : 'bg-white'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Avatar + info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-sm font-bold shrink-0">
                        {r.user_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900 text-sm">{r.user_name}</span>
                          {r.city && <span className="text-xs text-gray-400">{r.city}</span>}
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                          {!r.approved && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Hidden</span>
                          )}
                        </div>
                        <div className="flex text-amber-400 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} fill={i < r.rating ? 'currentColor' : 'none'} />
                          ))}
                          <span className="text-xs text-gray-400 ml-1.5">{r.rating}/5</span>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Toggle visibility */}
                      <button
                        onClick={() => handleToggleApproval(r.id, r.approved)}
                        title={r.approved ? 'Hide from public' : 'Make visible'}
                        className={`p-2 rounded-xl transition-colors text-sm ${
                          r.approved
                            ? 'bg-gray-100 text-gray-500 hover:bg-amber-50 hover:text-amber-600'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {r.approved ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>

                      {/* Delete */}
                      {confirmDelete === r.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 rounded-xl px-3 py-1.5">
                          <AlertTriangle size={13} className="text-red-500 shrink-0" />
                          <span className="text-xs text-red-600 font-medium">Permanent?</span>
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deleting === r.id}
                            className="text-xs font-bold text-red-600 hover:text-red-800 ml-1 disabled:opacity-50"
                          >
                            {deleting === r.id ? '...' : 'Yes, delete'}
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete(r.id)}
                          title="Delete permanently"
                          className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
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
