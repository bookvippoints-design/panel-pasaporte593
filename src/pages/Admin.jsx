import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'access'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = 'P593-'
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', city: '', address: '', phone: '',
    whatsapp: '', instagram: '', facebook: '', tiktok: '',
    website: '', description: '', category_id: '', lat: '', lng: '',
  })
  const [password, setPassword] = useState(generatePassword())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (unlocked) fetchCategories()
  }, [unlocked])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').order('name')
    setCategories(data || [])
  }

  function handlePin(e) {
    e.preventDefault()
    if (pin === ADMIN_PASSWORD) { setUnlocked(true); setPinError('') }
    else { setPinError('Contraseña incorrecta.') }
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function slugify(text) {
    return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess(null)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin
      ? { data: null, error: { message: 'Use service role' } }
      : { data: null, error: null }

    // Usamos signUp que funciona con anon key
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: password,
    })

    if (signUpError) {
      setError('Error creando usuario: ' + signUpError.message)
      setSaving(false)
      return
    }

    // 2. Insertar negocio
    const slug = slugify(form.name)
    const { data: biz, error: bizError } = await supabase.from('businesses').insert({
      name: form.name,
      slug: slug,
      description: form.description,
      category_id: form.category_id || null,
      city: form.city,
      address: form.address,
      phone: form.phone,
      whatsapp: form.whatsapp,
      instagram: form.instagram,
      facebook: form.facebook,
      tiktok: form.tiktok,
      website: form.website,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      active: true,
    }).select().single()

    if (bizError) {
      setError('Error creando establecimiento: ' + bizError.message)
      setSaving(false)
      return
    }

    // 3. Vincular en business_users
    await supabase.from('business_users').insert({
      business_id: biz.id,
      email: form.email,
    })

    setSuccess({ name: form.name, email: form.email, password, slug })
    setForm({
      name: '', email: '', city: '', address: '', phone: '',
      whatsapp: '', instagram: '', facebook: '', tiktok: '',
      website: '', description: '', category_id: '', lat: '', lng: '',
    })
    setPassword(generatePassword())
    setSaving(false)
  }

  // Pantalla de PIN
  if (!unlocked) return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-brand-orange font-heading font-bold text-lg">P</span>
            </div>
            <span className="font-heading font-bold text-white text-2xl">
              Pasaporte<span className="text-brand-orange">593</span>
            </span>
          </div>
          <p className="font-body text-white/60 text-sm">Acceso de administrador</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <div className="text-center mb-6">
            <span className="text-3xl">🔐</span>
            <h1 className="font-heading font-bold text-brand-navy text-xl mt-2">Zona privada</h1>
            <p className="font-body text-gray-500 text-sm mt-1">Solo para uso del administrador</p>
          </div>
          <form onSubmit={handlePin} className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Contraseña de acceso"
              required
              className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
            />
            {pinError && <p className="font-body text-red-500 text-xs">{pinError}</p>}
            <button
              type="submit"
              className="w-full bg-brand-orange text-white font-heading font-bold text-sm px-4 py-3.5 rounded-xl hover:bg-orange-500 transition-colors"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  // Panel de administrador
  return (
    <div className="min-h-screen bg-warm-bg py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-brand-navy flex items-center justify-center">
            <span className="text-brand-orange font-heading font-bold text-lg">P</span>
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-brand-navy text-2xl">Nuevo establecimiento</h1>
            <p className="font-body text-gray-400 text-sm">Registra un negocio afiliado a Pasaporte593</p>
          </div>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-6">
            <div className="text-2xl mb-2">✅</div>
            <p className="font-heading font-bold text-green-800 text-base mb-3">Establecimiento creado exitosamente</p>
            <div className="bg-white rounded-xl p-4 space-y-1.5 text-sm font-body">
              <p><span className="text-gray-500">Nombre:</span> <strong>{success.name}</strong></p>
              <p><span className="text-gray-500">Email:</span> <strong>{success.email}</strong></p>
              <p><span className="text-gray-500">Contraseña temporal:</span> <strong className="text-brand-orange font-mono">{success.password}</strong></p>
              <p><span className="text-gray-500">URL perfil:</span> <strong>pasaporte593.netlify.app/establecimientos/{success.slug}</strong></p>
            </div>
            <p className="font-body text-green-700 text-xs mt-3">Guarda estas credenciales antes de continuar — no se mostrarán de nuevo.</p>
            <button onClick={() => setSuccess(null)} className="mt-3 font-body text-sm text-brand-orange hover:underline">
              + Registrar otro establecimiento
            </button>
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Datos básicos */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-brand-navy text-base mb-5">Datos del establecimiento</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Nombre <span className="text-red-400">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Categoría</label>
                  <select name="category_id" value={form.category_id} onChange={handleChange}
                    className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange">
                    <option value="">Seleccionar categoría</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Ciudad</label>
                    <input type="text" name="city" value={form.city} onChange={handleChange}
                      className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Teléfono</label>
                    <input type="text" name="phone" value={form.phone} onChange={handleChange}
                      className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                  </div>
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Dirección</label>
                  <input type="text" name="address" value={form.address} onChange={handleChange}
                    className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Descripción</label>
                  <textarea name="description" value={form.description} onChange={handleChange} rows={3}
                    className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange resize-none" />
                </div>
              </div>
            </div>

            {/* Acceso */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-brand-navy text-base mb-5">Credenciales de acceso</h2>
              <div className="space-y-4">
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Email <span className="text-red-400">*</span></label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required
                    className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                </div>
                <div>
                  <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Contraseña temporal generada</label>
                  <div className="flex gap-3">
                    <input type="text" value={password} readOnly
                      className="flex-1 px-4 py-3 font-body text-sm border border-gray-200 rounded-xl bg-gray-50 font-mono text-brand-orange" />
                    <button type="button" onClick={() => setPassword(generatePassword())}
                      className="px-4 py-3 bg-gray-100 text-gray-600 font-body text-sm rounded-xl hover:bg-gray-200 transition-colors">
                      🔄
                    </button>
                  </div>
                  <p className="font-body text-gray-400 text-xs mt-1">Esta contraseña se entregará al establecimiento. Puede cambiarla luego.</p>
                </div>
              </div>
            </div>

            {/* Redes */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <h2 className="font-heading font-bold text-brand-navy text-base mb-5">Contacto y redes (opcional)</h2>
              <div className="space-y-4">
                {[
                  { name: 'whatsapp', label: 'WhatsApp', placeholder: '593999123456' },
                  { name: 'instagram', label: 'Instagram (sin @)', placeholder: 'miestablecimiento' },
                  { name: 'tiktok', label: 'TikTok (sin @)', placeholder: 'miestablecimiento' },
                  { name: 'facebook', label: 'Facebook', placeholder: 'URL o usuario' },
                  { name: 'website', label: 'Sitio web', placeholder: 'https://...' },
                ].map(f => (
                  <div key={f.name}>
                    <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">{f.label}</label>
                    <input type="text" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder}
                      className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Latitud</label>
                    <input type="text" name="lat" value={form.lat} onChange={handleChange} placeholder="-0.2295"
                      className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                  </div>
                  <div>
                    <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">Longitud</label>
                    <input type="text" name="lng" value={form.lng} onChange={handleChange} placeholder="-78.5243"
                      className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl">{error}</div>}

            <button type="submit" disabled={saving}
              className="w-full bg-brand-orange text-white font-heading font-bold text-base px-6 py-4 rounded-2xl hover:bg-orange-500 transition-colors disabled:opacity-60 shadow-sm">
              {saving ? 'Creando establecimiento...' : '✅ Crear establecimiento'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
