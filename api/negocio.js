const { getSession, cors } = require('./_lib/session');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  cors(res, 'GET, PUT');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let session;
  try {
    session = await getSession(req);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { negocio_id } = session;

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/negocios?id=eq.${negocio_id}&select=*`,
      {
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`
        }
      }
    );
    const rows = await r.json();
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Negocio no encontrado' });
    return res.status(200).json(rows[0]);
  }

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const allowed = [
      'nombre', 'telefono', 'direccion', 'costo_delivery',
      'estado_local', 'metodos_pago_json', 'datos_bancarios_json',
      'horarios_json', 'ignorar_bot_json', 'tipo_negocio'
    ];
    const body = req.body || {};
    const update = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    update.updated_at = new Date().toISOString();

    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/negocios?id=eq.${negocio_id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(update)
      }
    );
    const rows = await r.json();
    return res.status(200).json(Array.isArray(rows) ? rows[0] : rows);
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
