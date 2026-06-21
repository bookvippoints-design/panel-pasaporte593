import { useState } from 'react'
import { supabase } from '../supabase'

export default function Perfil({ business, onUpdate }) {
  const [form, setForm] = useState({
    name: business?.name || '',
    description: business?.description || '',
    city: business?.city || '',
    address: business?.address || '',
    phone: business?.phone || '',
    whatsapp: business?.whatsapp || '',
    instagram: business?.instagram || '',
   facebook: business?.facebook || '',
    tiktok: business?.tiktok || '',
    website: business?.website || '',
    lat: business?.lat || '',
    lng: business?.lng || '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(false)

    const { error } = await supabase
      .from('businesses')
      .update({
        name: form.name,
        description: form.description,
        city: form.city,
        address: form.address,
        phone: form.phone,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        facebook: form.facebook,
        website: form.website,
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      })
      .eq('id', business.id)

    if (error) {
      setError('Error al guardar. Intenta de nuevo.')
    } else {
      setSuccess(true)
      onUpdate()
    }
    setSaving(false)
  }

  const FIELDS = [
    { name: 'name', label: 'Nombre del establecimiento', type: 'text', required: true },
    { name: 'city', label: 'Ciudad', type: 'text' },
    { name: 'address', label: 'Dirección', type: 'text' },
    { name: 'phone', label: 'Teléfono', type: 'text' },
    { name: 'whatsapp', label: 'WhatsApp (número con código de país)', type: 'text', placeholder: '593999999999' },
    { name: 'instagram', label: 'Instagram (usuario sin @)', type: 'text' },
{ name: 'tiktok', label: 'TikTok (usuario sin @)', type: 'text' },
    { name: 'facebook', label: 'Facebook (URL o usuario)', type: 'text' },
{ name: 'tiktok', label: 'TikTok (usuario sin @)', type: 'text' },
    { name: 'website', label: 'Sitio web', type: 'url' },
    { name: 'lat', label: 'Latitud (Google Maps)', type: 'text', placeholder: '-0.2295' },
    { name: 'lng', label: 'Longitud (Google Maps)', type: 'text', placeholder: '-78.5243' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-brand-navy text-2xl mb-1">Mi perfil</h1>
        <p className="font-body text-gray-500 text-sm">Esta información aparece en tu página dentro de Pasaporte593.</p>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl">
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h2 className="font-heading font-bold text-brand-navy text-base mb-5">Información general</h2>
          <div className="space-y-4">
            {FIELDS.slice(0, 4).map(f => (
              <div key={f.name}>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                  {f.label} {f.required && <span className="text-red-400">*</span>}
                </label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  required={f.required}
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                />
              </div>
            ))}
            <div>
              <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Descripción</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange resize-none"
                placeholder="Describe tu establecimiento..."
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h2 className="font-heading font-bold text-brand-navy text-base mb-5">Contacto y redes</h2>
          <div className="space-y-4">
            {FIELDS.slice(4, 8).map(f => (
              <div key={f.name}>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <h2 className="font-heading font-bold text-brand-navy text-base mb-2">Ubicación en mapa</h2>
          <p className="font-body text-gray-400 text-xs mb-4">
            Abre Google Maps, busca tu establecimiento, clic derecho → "¿Qué hay aquí?" y copia las coordenadas.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {FIELDS.slice(8).map(f => (
              <div key={f.name}>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  name={f.name}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-green-50 text-green-700 font-body text-sm px-4 py-3 rounded-xl mb-4">✅ Perfil actualizado correctamente.</div>}

        <button
          type="submit"
          disabled={saving}
          className="bg-brand-orange text-white font-heading font-bold text-sm px-8 py-3.5 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
