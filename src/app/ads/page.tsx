'use client'
import { useState, useEffect, useRef } from 'react'
import AdminSidebar from '@/components/AdminSidebar'
import {
  Plus, Pencil, Trash2, X, Upload, ToggleLeft, ToggleRight,
  ChevronDown, ImageIcon, Link2, Calendar, MapPin, Star, AlertCircle,
} from 'lucide-react'
import {
  STATES, DISTRICTS_BY_STATE, CITIES_BY_DISTRICT, REGIONS,
} from '@/lib/locationData'

type Ad = {
  id: string
  image_url: string
  title: string | null
  link_url: string | null
  target_state: string | null
  target_district: string | null
  target_city: string | null
  region: string | null
  expiry_date: string
  is_active: boolean
  priority: number
  created_at: string
}

const EMPTY_FORM = {
  image_url:       '',
  title:           '',
  link_url:        '',
  target_state:    '',
  target_district: '',
  target_city:     '',
  region:          '',
  expiry_date:     '',
  is_active:       true,
  priority:        0,
}

function isExpired(ad: Ad): boolean {
  return new Date(ad.expiry_date) < new Date(new Date().toDateString())
}

function LabelledSelect({
  label, value, onChange, options, placeholder, disabled,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: string[]; placeholder: string; disabled?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 pr-7 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

export default function AdsPage() {
  const [ads,        setAds]        = useState<Ad[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editId,     setEditId]     = useState<string | null>(null)
  const [form,       setForm]       = useState({ ...EMPTY_FORM })
  const [saving,     setSaving]     = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [preview,    setPreview]    = useState<string>('')
  const [error,      setError]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const token = () => (typeof localStorage !== 'undefined' ? localStorage.getItem('admin_token') ?? '' : '')

  const fetchAds = async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/ads', { headers: { Authorization: `Bearer ${token()}` } })
      const data = await res.json()
      setAds(data.ads ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAds() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const openCreate = () => {
    setEditId(null)
    setForm({ ...EMPTY_FORM })
    setPreview('')
    setError('')
    setShowModal(true)
  }

  const openEdit = (ad: Ad) => {
    setEditId(ad.id)
    setForm({
      image_url:       ad.image_url,
      title:           ad.title           ?? '',
      link_url:        ad.link_url        ?? '',
      target_state:    ad.target_state    ?? '',
      target_district: ad.target_district ?? '',
      target_city:     ad.target_city     ?? '',
      region:          ad.region          ?? '',
      expiry_date:     ad.expiry_date,
      is_active:       ad.is_active,
      priority:        ad.priority,
    })
    setPreview(ad.image_url)
    setError('')
    setShowModal(true)
  }

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) { setError('Only image files are allowed.'); return }
    if (file.size > 5 * 1024 * 1024)    { setError('Image must be under 5 MB.');     return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/ads/upload', { method: 'POST', headers: { Authorization: `Bearer ${token()}` }, body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Upload failed'); return }
      setForm(f => ({ ...f, image_url: data.url }))
      setPreview(data.url)
    } catch {
      setError('Upload failed. Try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!form.image_url) { setError('Please upload a poster image.'); return }
    if (!form.expiry_date) { setError('Expiry date is required.'); return }
    setSaving(true); setError('')
    try {
      const body = {
        image_url:       form.image_url,
        title:           form.title           || null,
        link_url:        form.link_url        || null,
        target_state:    form.target_state    || null,
        target_district: form.target_district || null,
        target_city:     form.target_city     || null,
        region:          form.region          || null,
        expiry_date:     form.expiry_date,
        is_active:       form.is_active,
        priority:        Number(form.priority),
      }
      const url    = editId ? `/api/admin/ads/${editId}` : '/api/admin/ads'
      const method = editId ? 'PATCH' : 'POST'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Save failed'); return }
      setShowModal(false)
      fetchAds()
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this ad? This cannot be undone.')) return
    await fetch(`/api/admin/ads/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } })
    fetchAds()
  }

  const toggleActive = async (ad: Ad) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ is_active: !ad.is_active }),
    })
    fetchAds()
  }

  // Cascading dropdowns
  const districts = form.target_state ? (DISTRICTS_BY_STATE[form.target_state] ?? []) : []
  const cities    = form.target_district ? (CITIES_BY_DISTRICT[form.target_district] ?? []) : []

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ads / Promotions</h1>
            <p className="text-sm text-gray-500 mt-0.5">Create and manage location-targeted ad banners</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-500 transition-colors"
          >
            <Plus size={16} />
            New Ad
          </button>
        </div>

        {/* Ads table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading…</div>
          ) : ads.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <ImageIcon size={22} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No ads yet</p>
              <p className="text-xs text-gray-400 mt-1">Create your first ad to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Poster</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Target</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Expiry</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Priority</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Active</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {ads.map(ad => (
                    <tr key={ad.id} className="border-b border-gray-50 hover:bg-gray-50/40 transition-colors">
                      {/* Poster thumbnail */}
                      <td className="px-5 py-3">
                        <div className="w-20 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ad.image_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      </td>

                      {/* Title */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="font-medium text-gray-800 truncate">{ad.title ?? <span className="text-gray-400 italic">No title</span>}</p>
                        {ad.link_url && (
                          <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-0.5 mt-0.5">
                            <Link2 size={10} />
                            <span className="truncate max-w-[140px]">{ad.link_url}</span>
                          </a>
                        )}
                      </td>

                      {/* Target */}
                      <td className="px-4 py-3">
                        <div className="text-xs text-gray-600 space-y-0.5">
                          {ad.target_state    ? <div className="flex items-center gap-1"><MapPin size={10} className="text-blue-400"/>{ad.target_state}</div>   : <span className="text-gray-400 italic">National</span>}
                          {ad.target_district && <div className="text-gray-400 pl-3.5">{ad.target_district}</div>}
                          {ad.target_city     && <div className="text-gray-400 pl-3.5">{ad.target_city}</div>}
                          {ad.region          && <div className="text-purple-400 pl-3.5">Region: {ad.region}</div>}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-medium ${isExpired(ad) ? 'text-red-500' : 'text-gray-700'}`}>
                            {ad.expiry_date}
                          </span>
                          {isExpired(ad) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-50 text-red-500 text-[10px] font-bold uppercase tracking-wide">
                              <AlertCircle size={9} /> Expired
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Star size={11} className="text-amber-400" />
                          {ad.priority}
                        </div>
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleActive(ad)}
                          className={`transition-colors ${ad.is_active ? 'text-emerald-500' : 'text-gray-300'}`}
                          title={ad.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {ad.is_active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(ad)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(ad.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── Create / Edit Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-base font-bold text-gray-900">
                {editId ? 'Edit Ad' : 'New Ad'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                <X size={17} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">Poster Image *</label>
                <div
                  className={`relative border-2 border-dashed rounded-xl overflow-hidden transition-colors ${
                    uploading ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 cursor-pointer'
                  }`}
                  onClick={() => !uploading && fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleFileChange(file)
                  }}
                >
                  {preview ? (
                    <div className="relative w-full aspect-[3.5/1]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Change image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-2 text-gray-400">
                      {uploading ? (
                        <>
                          <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs">Uploading…</span>
                        </>
                      ) : (
                        <>
                          <Upload size={22} />
                          <span className="text-xs">Drop image here or click to browse</span>
                          <span className="text-[10px] text-gray-300">PNG, JPG, WebP · max 5 MB · landscape recommended</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Title <span className="font-normal text-gray-400">(optional)</span></label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. JEE coaching — Ahmedabad batch starting June"
                  maxLength={120}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Link URL */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                  <Link2 size={11} /> Link URL <span className="font-normal text-gray-400">(optional — makes poster clickable)</span>
                </label>
                <input
                  type="url"
                  value={form.link_url}
                  onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                  placeholder="https://example.com/coaching"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* Location targeting */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                  <MapPin size={12} /> Location Targeting
                </p>
                <p className="text-[11px] text-gray-400 -mt-1">Leave blank for a national ad (shown to everyone).</p>

                <LabelledSelect
                  label="State"
                  value={form.target_state}
                  onChange={v => setForm(f => ({ ...f, target_state: v, target_district: '', target_city: '' }))}
                  options={STATES}
                  placeholder="All states (national)"
                />
                {districts.length > 0 && (
                  <LabelledSelect
                    label="District"
                    value={form.target_district}
                    onChange={v => setForm(f => ({ ...f, target_district: v, target_city: '' }))}
                    options={districts}
                    placeholder="All districts in state"
                  />
                )}
                {cities.length > 0 && (
                  <LabelledSelect
                    label="City / Taluka"
                    value={form.target_city}
                    onChange={v => setForm(f => ({ ...f, target_city: v }))}
                    options={cities}
                    placeholder="All cities in district"
                  />
                )}
                <LabelledSelect
                  label="Region (for adjacent-district matching)"
                  value={form.region}
                  onChange={v => setForm(f => ({ ...f, region: v }))}
                  options={REGIONS}
                  placeholder="No region"
                />
              </div>

              {/* Expiry date + Priority + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Calendar size={11} /> Expiry Date *
                  </label>
                  <input
                    type="date"
                    value={form.expiry_date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                    <Star size={11} className="text-amber-400" /> Priority
                  </label>
                  <input
                    type="number"
                    value={form.priority}
                    min={0}
                    max={100}
                    onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Active</p>
                  <p className="text-xs text-gray-400">Inactive ads are hidden from students</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                  className={`transition-colors ${form.is_active ? 'text-emerald-500' : 'text-gray-300'}`}
                >
                  {form.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm">
                  <AlertCircle size={15} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {saving ? 'Saving…' : editId ? 'Save Changes' : 'Create Ad'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
