const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice(7);
  const now = new Date().toISOString();

  const r = await fetch(
    `${MAESTRO_URL}/rest/v1/sesiones_panel?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(now)}&select=*,clientes(*)`,
    {
      headers: {
        'apikey': MAESTRO_KEY,
        'Authorization': `Bearer ${MAESTRO_KEY}`
      }
    }
  );

  const sesiones = await r.json();
  if (!sesiones || sesiones.length === 0) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }

  const cliente = sesiones[0].clientes;
  if (!cliente || !cliente.activo) {
    return res.status(401).json({ error: 'Cliente inactivo' });
  }

  return res.status(200).json({
    nombre_negocio: cliente.nombre_negocio,
    slug: cliente.slug,
    canal_ntfy: cliente.canal_ntfy,
    plan: cliente.plan,
    vapid_public_key: process.env.VAPID_PUBLIC_KEY || null
  });
};
