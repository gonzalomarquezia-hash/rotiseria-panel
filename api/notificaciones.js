const { getSession, cors } = require('./_lib/session');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  cors(res, 'GET, PATCH');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let session;
  try {
    session = await getSession(req);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { negocio_id } = session;

  // GET — traer notificaciones del negocio (últimas 50)
  if (req.method === 'GET') {
    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/notificaciones?negocio_id=eq.${negocio_id}&order=created_at.desc&limit=50`,
      { headers: { 'apikey': MAESTRO_KEY, 'Authorization': `Bearer ${MAESTRO_KEY}` } }
    );
    const data = await r.json();
    return res.status(200).json(Array.isArray(data) ? data : []);
  }

  // PATCH — marcar todas como leídas
  if (req.method === 'PATCH') {
    await fetch(
      `${MAESTRO_URL}/rest/v1/notificaciones?negocio_id=eq.${negocio_id}&leida=eq.false`,
      {
        method: 'PATCH',
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ leida: true })
      }
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
