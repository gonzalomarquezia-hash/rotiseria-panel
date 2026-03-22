const { createClient } = require('@supabase/supabase-js');
const { getSession } = require('../_lib/session');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  let sesion;
  try {
    sesion = await getSession(req);
  } catch (e) {
    return res.status(e.status || 401).json({ error: e.error || 'No autorizado' });
  }

  const { endpoint, p256dh, auth } = req.body;
  if (!endpoint || !p256dh || !auth) {
    return res.status(400).json({ error: 'Faltan endpoint, p256dh o auth' });
  }

  const supabase = createClient(process.env.MAESTRO_URL, process.env.MAESTRO_SERVICE_KEY);

  const { error } = await supabase
    .from('suscripciones_push')
    .upsert({
      negocio_id: sesion.negocio_id,
      endpoint,
      p256dh,
      auth,
      user_agent: req.headers['user-agent'] || '',
      ultimo_acceso: new Date().toISOString()
    }, { onConflict: 'endpoint' });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ ok: true });
};
