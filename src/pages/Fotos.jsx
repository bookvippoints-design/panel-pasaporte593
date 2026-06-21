import { useState, useEffect, useRef } from 'react'
import { supabase } from '../supabase'

export default function Fotos({ business, onUpdate }) {
  const [mainUploading, setMainUploading] = useState(false)
  const [galleryImages, setGalleryImages] = useState([])
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const mainRef = useRef()
  const galleryRef = useRef()

  useEffect(() => {
    fetchGallery()
  }, [business])

  async function fetchGallery() {
    const { data } = await supabase
      .from('business_images')
      .select('*')
      .eq('business_id', business.id)
      .order('order')
    setGalleryImages(data || [])
  }

  async function uploadMainPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setMainUploading(true)
    setError('')
    setSuccess('')

    const ext = file.name.split('.').pop()
    const path = `${business.id}/main.${ext}`

    const { error: upError } = await supabase.storage
      .from('businesses')
      .upload(path, file, { upsert: true })

    if (upError) {
      setError('Error subiendo la foto. Intenta de nuevo.')
      setMainUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('businesses').getPublicUrl(path)

    await supabase.from('businesses').update({ image_url: publicUrl }).eq('id', business.id)
    setSuccess('Foto principal actualizada.')
    onUpdate()
    setMainUploading(false)
  }

  async function uploadGalleryPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    if (galleryImages.length >= 8) {
      setError('Máximo 8 fotos en la galería.')
      return
    }
    setGalleryUploading(true)
    setError('')
    setSuccess('')

    const ext = file.name.split('.').pop()
    const path = `${business.id}/gallery/${Date.now()}.${ext}`

    const { error: upError } = await supabase.storage
      .from('businesses')
      .upload(path, file, { upsert: false })

    if (upError) {
      setError('Error subiendo la foto.')
      setGalleryUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('businesses').getPublicUrl(path)

    await supabase.from('business_images').insert({
      business_id: business.id,
      url: publicUrl,
      order: galleryImages.length,
    })

    setSuccess('Foto agregada a la galería.')
    fetchGallery()
    setGalleryUploading(false)
  }

  async function deleteGalleryPhoto(img) {
    await supabase.from('business_images').delete().eq('id', img.id)
    setSuccess('Foto eliminada.')
    fetchGallery()
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-brand-navy text-2xl mb-1">Fotos</h1>
        <p className="font-body text-gray-500 text-sm">La foto principal aparece en tu tarjeta del directorio. La galería se muestra en tu perfil.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 font-body text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 font-body text-sm px-4 py-3 rounded-xl mb-4">✅ {success}</div>}

      {/* Main photo */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
        <h2 className="font-heading font-bold text-brand-navy text-base mb-4">Foto principal</h2>
        <div className="flex items-start gap-6">
          {business.image_url ? (
            <img src={business.image_url} alt="Principal" className="w-32 h-32 rounded-xl object-cover border border-gray-100" />
          ) : (
            <div className="w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-4xl">🏪</div>
          )}
          <div>
            <p className="font-body text-gray-500 text-sm mb-3">Formato JPG o PNG. Tamaño recomendado: 800x600px.</p>
            <input ref={mainRef} type="file" accept="image/*" onChange={uploadMainPhoto} className="hidden" />
            <button
              onClick={() => mainRef.current.click()}
              disabled={mainUploading}
              className="bg-brand-navy text-white font-heading font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-brand-navy/90 transition-colors disabled:opacity-60"
            >
              {mainUploading ? 'Subiendo...' : business.image_url ? 'Cambiar foto' : 'Subir foto'}
            </button>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-heading font-bold text-brand-navy text-base">Galería</h2>
            <p className="font-body text-gray-400 text-xs mt-0.5">{galleryImages.length} / 8 fotos</p>
          </div>
          {galleryImages.length < 8 && (
            <>
              <input ref={galleryRef} type="file" accept="image/*" onChange={uploadGalleryPhoto} className="hidden" />
              <button
                onClick={() => galleryRef.current.click()}
                disabled={galleryUploading}
                className="bg-brand-orange text-white font-heading font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-orange-500 transition-colors disabled:opacity-60"
              >
                {galleryUploading ? 'Subiendo...' : '+ Agregar foto'}
              </button>
            </>
          )}
        </div>

        {galleryImages.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-xl">
            <div className="text-4xl mb-2">📸</div>
            <p className="font-body text-gray-400 text-sm">Aún no hay fotos en la galería.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {galleryImages.map(img => (
              <div key={img.id} className="relative group">
                <img src={img.url} alt="" className="w-full aspect-video object-cover rounded-xl" />
                <button
                  onClick={() => deleteGalleryPhoto(img)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
