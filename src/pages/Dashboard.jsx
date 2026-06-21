export default function Dashboard({ business }) {
  if (!business) return null

  const activePromos = business.promotions?.filter(p => p.active) || []

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-brand-navy text-2xl mb-1">
          Bienvenido, {business.name} 👋
        </h1>
        <p className="font-body text-gray-500 text-sm">
          Gestiona tu perfil, fotos y promociones desde aquí.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Estado', value: business.active ? 'Activo ✅' : 'Inactivo', color: 'text-brand-emerald' },
          { label: 'Promociones activas', value: `${activePromos.length} / 5`, color: 'text-brand-orange' },
          { label: 'Categoría', value: business.categories?.name || '—', color: 'text-brand-navy' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <p className="font-body text-gray-400 text-xs mb-1">{s.label}</p>
            <p className={`font-heading font-bold text-lg ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Profile preview */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <div className="flex items-start gap-4">
          {business.image_url ? (
            <img src={business.image_url} alt={business.name} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl">🏪</div>
          )}
          <div className="flex-1">
            <h2 className="font-heading font-bold text-brand-navy text-lg">{business.name}</h2>
            <p className="font-body text-gray-400 text-sm mb-2">📌 {business.city}{business.address ? ` · ${business.address}` : ''}</p>
            <p className="font-body text-gray-600 text-sm leading-relaxed line-clamp-2">{business.description}</p>
          </div>
        </div>
      </div>

      {/* Stamp info */}
      <div className="bg-brand-navy rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">🛂</span>
          <h3 className="font-heading font-bold text-white text-base">Tu parada en Pasaporte593</h3>
        </div>
        <p className="font-body text-white/70 text-sm leading-relaxed mb-4">
          Los clientes pueden sellar su pasaporte en tu establecimiento escaneando el código QR mensual con la app BookVipPoints. Los puntos se acreditan automáticamente.
        </p>
        <div className="bg-white/10 rounded-xl px-4 py-3">
          <p className="font-body text-white/60 text-xs">
            ¿Necesitas tu código QR mensual? Contáctanos por WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
