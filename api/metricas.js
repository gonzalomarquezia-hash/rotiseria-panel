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
  const dias = parseInt(req.query?.dias) || 30;
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const url = `${MAESTRO_URL}/rest/v1/metricas_bot?negocio_id=eq.${negocio_id}&fecha=gte.${desde.toISOString()}&select=session_id,fecha,tuvo_pedido,fuera_horario`;

  const r = await fetch(url, {
    headers: {
      'apikey': MAESTRO_KEY,
      'Authorization': `Bearer ${MAESTRO_KEY}`
    }
  });

  const rows = await r.json();
  if (!Array.isArray(rows)) return res.status(200).json({ mensajes: 0, sesiones: 0, pedidos: 0, fuera_horario: 0 });

  const sesionesUnicas = new Set(rows.map(r => r.session_id)).size;

  return res.status(200).json({
    mensajes: rows.length,
    sesiones: sesionesUnicas,
    pedidos: rows.filter(r => r.tuvo_pedido).length,
    fuera_horario: rows.filter(r => r.fuera_horario).length,
    tiempo_ahorrado_min: rows.length * 2
  });
};
