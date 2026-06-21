import { useState } from 'react'
import { supabase } from '../supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Credenciales incorrectas. Verifica tu email y contraseña.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <span className="text-brand-orange font-heading font-bold text-lg">P</span>
            </div>
            <span className="font-heading font-bold text-white text-2xl">
              Pasaporte<span className="text-brand-orange">593</span>
            </span>
          </div>
          <p className="font-body text-white/60 text-sm">Panel de establecimiento</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h1 className="font-heading font-bold text-brand-navy text-xl mb-6 text-center">
            Inicia sesión
          </h1>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div>
              <label className="font-body text-sm font-medium text-gray-700 block mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 font-body text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white font-heading font-bold text-sm px-4 py-3.5 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión...' : 'Entrar al panel'}
            </button>
          </form>

          <p className="font-body text-gray-400 text-xs text-center mt-6 leading-relaxed">
            ¿No tienes acceso? Contáctanos por{' '}
            <a href="https://wa.me/593999999999" className="text-brand-emerald hover:underline">
              WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
