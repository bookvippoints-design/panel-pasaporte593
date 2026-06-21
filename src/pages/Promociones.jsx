import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const EMPTY = { title: '', description: '', type: 'descuento', value: '', valid_until: '' }

export default function Promociones({ business }) {
  const [promos, setPromos] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchPromos() }, [business])

  async function fetchPromos() {
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
    setPromos(data || [])
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
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
      setSuccess('Promoción actualizada.')
      setEditing(null)
    } else {
      await supabase.from('promotions').insert({ ...form, business_id: business.id, active: true, valid_until: form.valid_until || null })
      setSuccess('Promoción creada.')
    }
    setForm(EMPTY)
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
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const activeCount = promos.filter(p => p.active).length

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
                onClick={() => { setEditing(null); setForm(EMPTY) }}
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
            <div key={promo.id} className={`bg-white rounded-2xl p-5 border shadow-sm flex items-start justify-between gap-4 ${promo.active ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
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
          ))
        )}
      </div>
    </div>
  )
}
