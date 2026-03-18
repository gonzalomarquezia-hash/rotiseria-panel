const { getSession, cors } = require('../_lib/session');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  cors(res, 'PUT, DELETE');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let session;
  try {
    session = await getSession(req);
  } catch (e) {
    return res.status(e.status).json({ error: e.error });
  }

  const { negocio_id } = session;
  const { id } = req.query;

  if (!id) return res.status(400).json({ error: 'ID requerido' });

  // ── PUT ──────────────────────────────────────────────────────────────────
  if (req.method === 'PUT') {
    const allowed = [
      'nombre', 'categoria', 'descripcion',
      'precio_unitario', 'precio_media_docena', 'precio_docena', 'disponible'
    ];
    const body = req.body || {};
    const update = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }
    update.updated_at = new Date().toISOString();

    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/productos?id=eq.${id}&negocio_id=eq.${negocio_id}`,
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

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    await fetch(
      `${MAESTRO_URL}/rest/v1/productos?id=eq.${id}&negocio_id=eq.${negocio_id}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`
        }
      }
    );
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
