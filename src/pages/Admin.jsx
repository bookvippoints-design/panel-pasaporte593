import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

const ADMIN_PASSWORD = 'access'

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let pass = 'P593-'
  for (let i = 0; i < 6; i++) pass += chars[Math.floor(Math.random() * chars.length)]
  return pass
}

function slugify(text) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function Admin() {
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [form, setForm] = useState({ name: '', responsible: '', email: '' })
  const [password, setPassword] = useState(generatePassword())
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  function handlePin(e) {
    e.preventDefault()
    if (pin === ADMIN_PASSWORD) { setUnlocked(true); setPinError('') }
    else setPinError('Contraseña incorrecta.')
  }

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    // 1. Crear usuario en Auth
    const { error: signUpError } = await supabase.auth.signUp({
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
    const { data: biz, error: bizError } = await supabase
      .from('businesses')
      .insert({ name: form.name, slug, active: true })
      .select().single()

    if (bizError) {
      setError('Error creando establecimiento: ' + bizError.message)
      setSaving(false)
      return
    }

    // 3. Vincular business_users
    await supabase.from('business_users').insert({
      business_id: biz.id,
      email: form.email,
    })

    // 4. Enviar correo de bienvenida con PDFs
    try {
      await fetch('/.netlify/functions/send-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          responsible: form.responsible,
          email: form.email,
          password: password,
        }),
      })
    } catch (e) {
      console.error('Error enviando correo:', e)
    }

    setSuccess({ ...form, password, slug })
    setForm({ name: '', responsible: '', email: '' })
    setPassword(generatePassword())
    setSaving(false)
  }

  // Pantalla PIN
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
            <button type="submit"
              className="w-full bg-brand-orange text-white font-heading font-bold text-sm px-4 py-3.5 rounded-xl hover:bg-orange-500 transition-colors">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  // Panel admin
  return (
    <div className="min-h-screen bg-warm-bg flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-navy flex items-center justify-center">
              <span className="text-brand-orange font-heading font-bold text-sm">P</span>
            </div>
            <span className="font-heading font-bold text-brand-navy text-xl">
              Pasaporte<span className="text-brand-orange">593</span>
            </span>
          </div>
          <p className="font-body text-gray-400 text-sm">Nuevo establecimiento afiliado</p>
        </div>

        {success ? (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="font-heading font-bold text-brand-navy text-lg">¡Listo!</h2>
              <p className="font-body text-gray-500 text-sm mt-1">Establecimiento creado exitosamente</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm font-body mb-6">
              <div>
                <p className="text-gray-400 text-xs">Establecimiento</p>
                <p className="font-heading font-bold text-brand-navy">{success.name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Responsable</p>
                <p className="font-semibold text-gray-700">{success.responsible}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="font-semibold text-gray-700">{success.email}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">Contraseña temporal</p>
                <p className="font-mono font-bold text-brand-orange text-base">{success.password}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs">URL del perfil</p>
                <p className="text-gray-600 text-xs break-all">pasaporte593.netlify.app/establecimientos/{success.slug}</p>
              </div>
            </div>
            <p className="font-body text-amber-600 text-xs text-center mb-5">
              ⚠️ Guarda estas credenciales — no se mostrarán de nuevo.
            </p>
            <button
              onClick={() => setSuccess(null)}
              className="w-full bg-brand-orange text-white font-heading font-bold text-sm px-4 py-3.5 rounded-xl hover:bg-orange-500 transition-colors"
            >
              + Registrar otro establecimiento
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 shadow-xl">
            <h1 className="font-heading font-bold text-brand-navy text-xl mb-6 text-center">
              Datos del afiliado
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                  Nombre del establecimiento <span className="text-red-400">*</span>
                </label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required
                  placeholder="Ej: Hotel Cascada Real"
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                  Nombre del responsable <span className="text-red-400">*</span>
                </label>
                <input type="text" name="responsible" value={form.responsible} onChange={handleChange} required
                  placeholder="Ej: María González"
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                  Correo electrónico <span className="text-red-400">*</span>
                </label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required
                  placeholder="correo@establecimiento.com"
                  className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange" />
              </div>
              <div>
                <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                  Contraseña temporal
                </label>
                <div className="flex gap-2">
                  <input type="text" value={password} readOnly
                    className="flex-1 px-4 py-3 font-body text-sm border border-gray-200 rounded-xl bg-gray-50 font-mono text-brand-orange" />
                  <button type="button" onClick={() => setPassword(generatePassword())}
                    title="Generar nueva contraseña"
                    className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                    🔄
                  </button>
                </div>
              </div>

              {error && <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl">{error}</div>}

              <button type="submit" disabled={saving}
                className="w-full bg-brand-orange text-white font-heading font-bold text-sm px-4 py-3.5 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60 mt-2">
                {saving ? 'Creando...' : '✅ Crear establecimiento'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
