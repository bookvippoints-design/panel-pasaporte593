import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

const EMPTY = { title: '', description: '', type: 'descuento', value: '', valid_until: '' }

export default function Promociones({ business }) {
  const [promos, setPromos] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [images, setImages] = useState([]) // archivos nuevos a subir
  const [previews, setPreviews] = useState([]) // previews locales
  const [existingImages, setExistingImages] = useState([]) // imágenes ya guardadas
  const fileRef = useRef()

  useEffect(() => { fetchPromos() }, [business])

  async function fetchPromos() {
    const { data } = await supabase
      .from('promotions')
      .select('*, promotion_images(*)')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    setPromos(data || [])
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files)
    const total = existingImages.length + images.length + files.length
    if (total > 3) {
      setError('Máximo 3 imágenes por promoción.')
      return
    }
    setImages(prev => [...prev, ...files])
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    setError('')
  }

  function removeNewImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function removeExistingImage(img) {
    const path = img.image_url.split('/storage/v1/object/public/businesses/')[1]
    await supabase.storage.from('businesses').remove([path])
    await supabase.from('promotion_images').delete().eq('id', img.id)
    setExistingImages(prev => prev.filter(i => i.id !== img.id))
  }

  async function uploadImages(promoId) {
    for (const file of images) {
      const ext = file.name.split('.').pop()
      const path = `promotions/${promoId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await supabase.storage.from('businesses').upload(path, file)
      if (!error) {
        const { data: urlData } = supabase.storage.from('businesses').getPublicUrl(path)
        await supabase.from('promotion_images').insert({ promotion_id: promoId, image_url: urlData.publicUrl })
      }
    }
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const activeCount = promos.filter(p => p.active && p.id !== editing).length
    if (!editing && activeCount >= 5) {
      setError('Máximo 5 promociones activas. Desactiva una antes de agregar otra.')
      return
    }

    setSaving(true)
    if (editing) {
      await supabase.from('promotions').update({ ...form, valid_until: form.valid_until || null }).eq('id', editing)
      await uploadImages(editing)
      setSuccess('Promoción actualizada.')
      setEditing(null)
    } else {
      const { data } = await supabase.from('promotions').insert({ ...form, business_id: business.id, active: true, valid_until: form.valid_until || null }).select().single()
      if (data) await uploadImages(data.id)
      setSuccess('Promoción creada.')
    }
    setForm(EMPTY)
    setImages([])
    setPreviews([])
    setExistingImages([])
    fetchPromos()
    setSaving(false)
  }

  async function toggleActive(promo) {
    const activeCount = promos.filter(p => p.active && p.id !== promo.id).length
    if (!promo.active && activeCount >= 5) {
      setError('Máximo 5 promociones activas.')
      return
    }
    await supabase.from('promotions').update({ active: !promo.active }).eq('id', promo.id)
    fetchPromos()
  }

  async function deletePromo(id) {
    if (!confirm('¿Eliminar esta promoción?')) return
    await supabase.from('promotions').delete().eq('id', id)
    fetchPromos()
  }

  function startEdit(promo) {
    setEditing(promo.id)
    setForm({
      title: promo.title,
      description: promo.description || '',
      type: promo.type,
      value: promo.value || '',
      valid_until: promo.valid_until || '',
    })
    setExistingImages(promo.promotion_images || [])
    setImages([])
    setPreviews([])
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCount = promos.filter(p => p.active).length
  const totalImages = existingImages.length + images.length

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-brand-navy text-2xl mb-1">Promociones</h1>
        <p className="font-body text-gray-500 text-sm">
          Puedes tener hasta 5 promociones activas. Activas: <strong>{activeCount}/5</strong>
        </p>
      </div>

      {error && <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 font-body text-sm px-4 py-3 rounded-xl mb-4">✅ {success}</div>}

      {/* Form */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <h2 className="font-heading font-bold text-brand-navy text-base mb-5">
          {editing ? 'Editar promoción' : 'Nueva promoción'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Título <span className="text-red-400">*</span></label>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="Ej: 20% de descuento en consumo mínimo de $15"
              className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
            />
          </div>
          <div>
            <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Descripción</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="Detalles adicionales de la promoción..."
              className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Tipo</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
              >
                <option value="descuento">🏷️ Descuento</option>
                <option value="puntos_extra">⭐ Puntos extra</option>
              </select>
            </div>
            <div>
              <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Valor</label>
              <input
                type="text"
                name="value"
                value={form.value}
                onChange={handleChange}
                placeholder="Ej: 20% o 2x puntos"
                className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
              />
            </div>
          </div>
          <div>
            <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Válido hasta (opcional)</label>
            <input
              type="date"
              name="valid_until"
              value={form.valid_until}
              onChange={handleChange}
              className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
            />
          </div>

          {/* Imágenes */}
          <div>
            <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
              Imágenes <span className="text-gray-400 font-normal">(máximo 3)</span>
            </label>

            {/* Imágenes existentes */}
            {existingImages.length > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">
                {existingImages.map(img => (
                  <div key={img.id} className="relative w-24 h-24">
                    <img src={img.image_url} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Previews nuevas */}
            {previews.length > 0 && (
              <div className="flex gap-3 mb-3 flex-wrap">
                {previews.map((src, i) => (
                  <div key={i} className="relative w-24 h-24">
                    <img src={src} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(i)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center leading-none"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {totalImages < 3 && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  ref={fileRef}
                  onChange={handleFiles}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-4 font-body text-sm text-gray-400 hover:border-brand-orange hover:text-brand-orange transition-colors"
                >
                  + Agregar imagen ({totalImages}/3)
                </button>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-orange text-white font-heading font-bold text-sm px-6 py-3 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Crear promoción'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => { setEditing(null); setForm(EMPTY); setImages([]); setPreviews([]); setExistingImages([]) }}
                className="bg-gray-100 text-gray-700 font-heading font-semibold text-sm px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* List */}
      <div className="space-y-3">
        {promos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100 shadow-sm">
            <div className="text-4xl mb-2">🏷️</div>
            <p className="font-body text-gray-400 text-sm">Aún no tienes promociones. Crea la primera arriba.</p>
          </div>
        ) : (
          promos.map(promo => (
            <div key={promo.id} className={`bg-white rounded-2xl p-5 border shadow-sm ${promo.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-xl mt-0.5">{promo.type === 'puntos_extra' ? '⭐' : '🏷️'}</span>
                  <div>
                    <p className="font-heading font-semibold text-brand-navy text-sm">{promo.title}</p>
                    {promo.description && <p className="font-body text-gray-500 text-xs mt-0.5">{promo.description}</p>}
                    <div className="flex items-center gap-3 mt-1.5">
                      {promo.value && <span className="font-body text-xs text-brand-orange bg-orange-50 px-2 py-0.5 rounded-full">{promo.value}</span>}
                      {promo.valid_until && <span className="font-body text-xs text-gray-400">Hasta: {new Date(promo.valid_until).toLocaleDateString('es-EC')}</span>}
                      <span className={`font-body text-xs px-2 py-0.5 rounded-full ${promo.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {promo.active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(promo)} className="font-body text-xs text-brand-navy hover:underline">Editar</button>
                  <button onClick={() => toggleActive(promo)} className={`font-body text-xs ${promo.active ? 'text-gray-400 hover:text-red-500' : 'text-green-600 hover:underline'}`}>
                    {promo.active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button onClick={() => deletePromo(promo.id)} className="font-body text-xs text-red-400 hover:underline">Eliminar</button>
                </div>
              </div>

              {/* Imágenes de la promoción */}
              {promo.promotion_images && promo.promotion_images.length > 0 && (
                <div className="flex gap-2 mt-3 flex-wrap">
                  {promo.promotion_images.map(img => (
                    <img key={img.id} src={img.image_url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-100" />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
