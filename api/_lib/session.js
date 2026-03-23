const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

/**
 * Valida el token Bearer y devuelve { negocio_id, slug, cliente_id }
 * Lanza un objeto { status, error } si la sesión no es válida.
 */
async function getSession(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw { status: 401, error: 'Token requerido' };
  }

  const token = authHeader.slice(7);
  const now = new Date().toISOString();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let r;
  try {
    r = await fetch(
      `${MAESTRO_URL}/rest/v1/sesiones_panel?token=eq.${encodeURIComponent(token)}&expires_at=gt.${encodeURIComponent(now)}&select=*,clientes(id,slug,activo)`,
      {
        headers: { 'apikey': MAESTRO_KEY, 'Authorization': `Bearer ${MAESTRO_KEY}` },
        signal: controller.signal
      }
    );
  } catch (e) {
    clearTimeout(timeout);
    throw { status: 503, error: 'Servicio no disponible' };
  }
  clearTimeout(timeout);

  const sesiones = await r.json();
  if (!sesiones || sesiones.length === 0) {
    throw { status: 401, error: 'Sesión inválida o expirada' };
  }

  const cliente = sesiones[0].clientes;
  if (!cliente || !cliente.activo) {
    throw { status: 401, error: 'Cliente inactivo' };
  }

  // Buscar negocio_id por slug
  const controller2 = new AbortController();
  const timeout2 = setTimeout(() => controller2.abort(), 8000);
  let nr;
  try {
    nr = await fetch(
      `${MAESTRO_URL}/rest/v1/negocios?slug=eq.${encodeURIComponent(cliente.slug)}&select=id`,
      {
        headers: { 'apikey': MAESTRO_KEY, 'Authorization': `Bearer ${MAESTRO_KEY}` },
        signal: controller2.signal
      }
    );
  } catch (e) {
    clearTimeout(timeout2);
    throw { status: 503, error: 'Servicio no disponible' };
  }
  clearTimeout(timeout2);

  const negocios = await nr.json();
  if (!negocios || negocios.length === 0) {
    throw { status: 404, error: 'Negocio no encontrado' };
  }

  return {
    negocio_id: negocios[0].id,
    slug: cliente.slug,
    cliente_id: cliente.id
  };
}

function cors(res, methods = 'GET, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', `${methods}, OPTIONS`);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { getSession, cors };
