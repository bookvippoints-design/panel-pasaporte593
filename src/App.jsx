import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Perfil from './pages/Perfil'
import Fotos from './pages/Fotos'
import Promociones from './pages/Promociones'
import Layout from './components/Layout'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const [session, setSession] = useState(null)
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) fetchBusiness(session.user.email)
      else setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) fetchBusiness(session.user.email)
      else { setBusiness(null); setLoading(false) }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function fetchBusiness(email) {
    const { data: bu } = await supabase
      .from('business_users')
      .select('business_id')
      .eq('email', email)
      .single()

    if (bu) {
      const { data: biz } = await supabase
        .from('businesses')
        .select('*, categories(name, icon), promotions(*)')
        .eq('id', bu.business_id)
        .single()
      setBusiness(biz)
    }
    setLoading(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-brand-navy flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-pulse">🛂</div>
        <p className="font-body text-white/60 text-sm">Cargando...</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={session ? <Navigate to="/panel" replace /> : <Login />} />
        <Route path="/" element={<Navigate to="/panel" replace />} />
        <Route path="/panel" element={
          <ProtectedRoute session={session}>
            <Layout business={business}>
              <Dashboard business={business} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/panel/perfil" element={
          <ProtectedRoute session={session}>
            <Layout business={business}>
              <Perfil business={business} onUpdate={() => fetchBusiness(session?.user?.email)} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/panel/fotos" element={
          <ProtectedRoute session={session}>
            <Layout business={business}>
              <Fotos business={business} onUpdate={() => fetchBusiness(session?.user?.email)} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/panel/promociones" element={
          <ProtectedRoute session={session}>
            <Layout business={business}>
              <Promociones business={business} />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/panel" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
