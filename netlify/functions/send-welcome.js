const https = require('https')

function fetchPdfAsBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve(Buffer.concat(chunks).toString('base64')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const { name, responsible, email, password } = JSON.parse(event.body)
  const BREVO_KEY = process.env.BREVO_API_KEY
  const BASE_URL = 'https://panel-pasaporte593.netlify.app'

  let terminosPdf = ''
  let manualPdf = ''
  try {
    terminosPdf = await fetchPdfAsBase64(`${BASE_URL}/terminos_condiciones.pdf`)
    manualPdf = await fetchPdfAsBase64(`${BASE_URL}/manual_panel.pdf`)
  } catch (e) {
    console.error('Error descargando PDFs:', e)
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1A3F7A;padding:32px;text-align:center;">
            <p style="margin:0;font-size:26px;font-weight:800;color:#ffffff;">Pasaporte<span style="color:#F97316;">593</span></p>
            <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.6);">Programa de Fidelización — Ecuador</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#1A3F7A;">¡Bienvenido a Pasaporte593, ${responsible}! 👋</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
              Es un gusto tenerte como parte de nuestra red. <strong>${name}</strong> ya forma parte del programa de fidelización que premia a tus clientes con puntos canjeables en hospedajes cada vez que te visitan.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border-radius:12px;padding:20px;margin-bottom:24px;">
              <tr><td>
                <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#F97316;text-transform:uppercase;letter-spacing:0.5px;">Tus datos de acceso</p>
                <p style="margin:0 0 8px;font-size:13px;color:#374151;">🔗 <strong>Panel:</strong> <a href="https://panel-pasaporte593.netlify.app" style="color:#1A3F7A;">panel-pasaporte593.netlify.app</a></p>
                <p style="margin:0 0 8px;font-size:13px;color:#374151;">📧 <strong>Usuario:</strong> ${email}</p>
                <p style="margin:0;font-size:13px;color:#374151;">🔑 <strong>Contraseña temporal:</strong> <span style="font-family:monospace;background:#fff;padding:2px 8px;border-radius:6px;color:#F97316;font-weight:700;">${password}</span></p>
              </td></tr>
            </table>
            <p style="margin:0 0 20px;font-size:13px;color:#6b7280;">Te recomendamos cambiar tu contraseña la primera vez que ingreses al panel.</p>
            <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1A3F7A;">¿Qué puedes hacer en tu panel?</p>
            <p style="margin:0 0 6px;font-size:13px;color:#374151;">📋 Actualizar la información y fotos de tu establecimiento</p>
            <p style="margin:0 0 6px;font-size:13px;color:#374151;">🏷️ Crear y gestionar tus promociones activas</p>
            <p style="margin:0 0 24px;font-size:13px;color:#374151;">⭐ Crear cuentas BookVipPoints con 100 puntos de regalo para tus clientes</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr><td align="center">
                <a href="https://panel-pasaporte593.netlify.app" style="display:inline-block;background:#F97316;color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">Ingresar al panel →</a>
              </td></tr>
            </table>
            <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;">
              Si tienes alguna duda, escríbenos por WhatsApp: <a href="https://wa.me/593981350463" style="color:#10B981;font-weight:600;">+593 98 135 0463</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Pasaporte593 — Ecuador 🇪🇨<br>
              <a href="mailto:activaciones@gmx.com" style="color:#9ca3af;">activaciones@gmx.com</a> · 
              <a href="https://pasaporte593.netlify.app" style="color:#9ca3af;">pasaporte593.netlify.app</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const payload = JSON.stringify({
    sender: { name: 'Pasaporte593', email: 'activaciones@gmx.com' },
    to: [{ email, name: responsible }],
    subject: `Bienvenido a Pasaporte593 — Tus credenciales de acceso`,
    htmlContent: html,
    attachment: [
      ...(terminosPdf ? [{ name: 'Terminos_y_Condiciones_Pasaporte593.pdf', content: terminosPdf }] : []),
      ...(manualPdf ? [{ name: 'Manual_Panel_Pasaporte593.pdf', content: manualPdf }] : []),
    ],
  })

  const result = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': BREVO_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    req.write(payload)
    req.end()
  })

  console.log('Brevo response:', result)

  return {
    statusCode: result.status === 200 || result.status === 201 ? 200 : 500,
    body: result.body,
  }
}
