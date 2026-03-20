const webPush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
  throw new Error('Faltan VAPID_PUBLIC_KEY o VAPID_PRIVATE_KEY en las variables de entorno');
}

webPush.setVapidDetails(
  'mailto:admin@rotiseria.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Auth para n8n
  const API_TOKEN = process.env.PUSH_API_TOKEN;
  if (API_TOKEN) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  const { negocio_id, title, body } = req.body;
  if (!negocio_id || !title) {
    return res.status(400).json({ error: 'Faltan negocio_id o title' });
  }

  const supabase = createClient(process.env.MAESTRO_URL, process.env.MAESTRO_SERVICE_KEY);

  const { data: subs, error } = await supabase
    .from('suscripciones_push')
    .select('endpoint, p256dh, auth')
    .eq('negocio_id', negocio_id);

  if (error) return res.status(500).json({ error: error.message });
  if (!subs || subs.length === 0) return res.status(200).json({ ok: true, enviados: 0 });

  const payload = JSON.stringify({
    title,
    body: body || '',
    icon: 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
    badge: 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
    requireInteraction: true,
    tag: 'nuevo-pedido'
  });

  const results = await Promise.allSettled(
    subs.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
    )
  );

  const enviados = results.filter(r => r.status === 'fulfilled').length;
  return res.status(200).json({ ok: true, enviados, total: subs.length });
};
