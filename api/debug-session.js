// Endpoint temporal de diagnóstico — ELIMINAR después de resolver el problema
const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  const resultado = {
    env: {
      MAESTRO_URL: MAESTRO_URL ? MAESTRO_URL.substring(0, 30) + '...' : 'NO DEFINIDO',
      MAESTRO_KEY_tipo: !MAESTRO_KEY ? 'NO DEFINIDO'
        : MAESTRO_KEY.startsWith('eyJ') ? 'JWT (ok)'
        : 'formato inesperado',
      MAESTRO_KEY_preview: MAESTRO_KEY ? MAESTRO_KEY.slice(0, 10) + '...' + MAESTRO_KEY.slice(-6) : null
    },
    token_recibido: token ? token.slice(0, 8) + '...' : 'NINGUNO',
    pasos: {}
  };

  if (!token) return res.status(200).json(resultado);

  // Paso 1: query sesiones_panel
  try {
    const now = new Date().toISOString();
    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/sesiones_panel?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(now)}&select=*,clientes(id,slug,activo)`,
      { headers: { 'apikey': MAESTRO_KEY, 'Authorization': `Bearer ${MAESTRO_KEY}` } }
    );
    const data = await r.json();
    resultado.pasos.sesiones_status = r.status;
    resultado.pasos.sesiones_count = Array.isArray(data) ? data.length : 'no es array';
    resultado.pasos.sesiones_error = Array.isArray(data) ? null : data;

    if (Array.isArray(data) && data.length > 0) {
      resultado.pasos.clientes_join = data[0].clientes;
      resultado.pasos.expires_at = data[0].expires_at;
    }
  } catch (e) {
    resultado.pasos.sesiones_exception = e.message;
  }

  return res.status(200).json(resultado);
};
