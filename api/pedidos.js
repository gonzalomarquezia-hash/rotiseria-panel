const { getSession, cors } = require('./_lib/session');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  cors(res, 'GET');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });

  let session;
  try {
    session = await getSession(req);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { negocio_id } = session;

  // Filtros opcionales via query params
  const estado = req.query?.estado;
  let url = `${MAESTRO_URL}/rest/v1/pedidos?negocio_id=eq.${negocio_id}&select=*&order=created_at.desc`;
  if (estado) url += `&estado=eq.${encodeURIComponent(estado)}`;

  const r = await fetch(url, {
    headers: {
      'apikey': MAESTRO_KEY,
      'Authorization': `Bearer ${MAESTRO_KEY}`
    }
  });

  const pedidos = await r.json();
  return res.status(200).json(Array.isArray(pedidos) ? pedidos : []);
};
