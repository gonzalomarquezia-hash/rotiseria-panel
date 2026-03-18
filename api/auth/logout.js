const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(200).json({ ok: true });
  }

  const token = authHeader.slice(7);

  await fetch(
    `${MAESTRO_URL}/rest/v1/sesiones_panel?token=eq.${encodeURIComponent(token)}`,
    {
      method: 'DELETE',
      headers: {
        'apikey': MAESTRO_KEY,
        'Authorization': `Bearer ${MAESTRO_KEY}`
      }
    }
  );

  return res.status(200).json({ ok: true });
};
