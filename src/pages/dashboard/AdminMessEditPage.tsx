import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Loader2, Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { invalidatePlatformCache } from '../../lib/platformData'
import { uploadToCloudinary } from '../../utils/cloudinary'

export default function AdminMessEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    contact_phone: '',
    monthly_charge: '',
    per_meal_charge: '',
    food_type: 'both' as 'veg' | 'non_veg' | 'both'
  })

  useEffect(() => {
    const loadMess = async () => {
      if (!id) return
      setLoading(true)

      const { data, error } = await supabase
        .from('messes')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        navigate('/dashboard/admin/messes', { replace: true })
        return
      }

      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        address: data.address ?? '',
        city: data.city ?? '',
        contact_phone: data.contact_phone ?? '',
        monthly_charge: data.monthly_charge?.toString() ?? '',
        per_meal_charge: data.per_meal_charge?.toString() ?? '',
        food_type: data.food_type ?? 'both'
      })
      setImages(Array.isArray(data.photos) ? data.photos : [])
      setLoading(false)
    }

    void loadMess()
  }, [id, navigate])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(file => uploadToCloudinary(file))
      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls].slice(0, 6))
    } catch (error: any) {
      console.error('Failed to upload mess images:', error)
      window.alert('Failed to upload one or more images. Please try again.')
    } finally {
      setUploadingImages(false)
      e.target.value = ''
    }
  }

  const handleRemoveImage = (idx: number) => {
    setImages(prev => prev.filter((_, index) => index !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id) return

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        contact_phone: form.contact_phone.trim(),
        monthly_charge: Number(form.monthly_charge),
        per_meal_charge: form.per_meal_charge === '' ? null : Number(form.per_meal_charge),
        food_type: form.food_type,
        photos: images,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase.from('messes').update(payload).eq('id', id)
      if (error) throw error

      invalidatePlatformCache()
      navigate('/dashboard/admin/messes', { replace: true })
    } catch (error: any) {
      console.error('Failed to update mess:', error)
      window.alert('Failed to update mess. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Admin tools</p>
            <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Edit Mess</h1>
          </div>
          <button onClick={() => navigate('/dashboard/admin/messes')} className="btn-secondary inline-flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading mess details...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Mess name</span>
                  <input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} className="input-field" required />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Phone</span>
                  <input value={form.contact_phone} onChange={(e) => setForm(prev => ({ ...prev, contact_phone: e.target.value }))} className="input-field" required />
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                <span className="mb-1 block">Description</span>
                <textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className="input-field" required />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Address</span>
                  <input value={form.address} onChange={(e) => setForm(prev => ({ ...prev, address: e.target.value }))} className="input-field" required />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">City</span>
                  <input value={form.city} onChange={(e) => setForm(prev => ({ ...prev, city: e.target.value }))} className="input-field" required />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Monthly charge</span>
                  <input type="number" min="0" value={form.monthly_charge} onChange={(e) => setForm(prev => ({ ...prev, monthly_charge: e.target.value }))} className="input-field" required />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Per meal charge</span>
                  <input type="number" min="0" value={form.per_meal_charge} onChange={(e) => setForm(prev => ({ ...prev, per_meal_charge: e.target.value }))} className="input-field" />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  <span className="mb-1 block">Food type</span>
                  <select value={form.food_type} onChange={(e) => setForm(prev => ({ ...prev, food_type: e.target.value as 'veg' | 'non_veg' | 'both' }))} className="input-field">
                    <option value="veg">Veg</option>
                    <option value="non_veg">Non Veg</option>
                    <option value="both">Both</option>
                  </select>
                </label>
              </div>

              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mess Images</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Upload or replace images for this mess listing.</p>
                  </div>
                  <label className="btn-secondary inline-flex cursor-pointer items-center gap-2 text-sm">
                    <Upload className="h-4 w-4" />
                    {uploadingImages ? 'Uploading...' : 'Upload Images'}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>

                {images.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {images.map((image, idx) => (
                      <div key={`${image}-${idx}`} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                        <img src={image} alt={`Mess ${idx + 1}`} className="h-32 w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-800"
                          title="Remove image"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                    No images uploaded yet.
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => navigate('/dashboard/admin/messes')} className="btn-secondary text-sm">Cancel</button>
                <button type="submit" disabled={saving || uploadingImages} className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
