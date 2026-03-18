const { getSession, cors } = require('./_lib/session');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  cors(res, 'GET, POST');
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
      `${MAESTRO_URL}/rest/v1/productos?negocio_id=eq.${negocio_id}&select=*&order=categoria.asc,nombre.asc`,
      {
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`
        }
      }
    );
    const rows = await r.json();
    return res.status(200).json(Array.isArray(rows) ? rows : []);
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body || {};
    const now = new Date().toISOString();
    const producto = {
      negocio_id,
      nombre: body.nombre,
      categoria: body.categoria || null,
      descripcion: body.descripcion || null,
      precio_unitario: body.precio_unitario ?? 0,
      precio_media_docena: body.precio_media_docena ?? null,
      precio_docena: body.precio_docena ?? null,
      disponible: body.disponible ?? true,
      created_at: now,
      updated_at: now
    };

    const r = await fetch(
      `${MAESTRO_URL}/rest/v1/productos`,
      {
        method: 'POST',
        headers: {
          'apikey': MAESTRO_KEY,
          'Authorization': `Bearer ${MAESTRO_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(producto)
      }
    );
    const rows = await r.json();
    return res.status(201).json(Array.isArray(rows) ? rows[0] : rows);
  }

  return res.status(405).json({ error: 'Método no permitido' });
};
