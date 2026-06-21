import { NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const NAV = [
  { to: '/panel', label: 'Inicio', icon: '🏠', end: true },
  { to: '/panel/perfil', label: 'Mi perfil', icon: '📋' },
  { to: '/panel/fotos', label: 'Fotos', icon: '📸' },
  { to: '/panel/promociones', label: 'Promociones', icon: '🏷️' },
]

export default function Layout({ children, business }) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-warm-bg flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-navy flex flex-col fixed h-full">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <span className="text-brand-orange font-heading font-bold text-sm">P</span>
            </div>
            <span className="font-heading font-bold text-white text-base">
              Pasaporte<span className="text-brand-orange">593</span>
            </span>
          </div>
          {business && (
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <p className="font-heading font-semibold text-white text-sm truncate">{business.name}</p>
              <p className="font-body text-white/50 text-xs truncate">{business.city}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-orange text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-body text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <span>🚪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
