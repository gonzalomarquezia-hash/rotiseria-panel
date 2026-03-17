const webPush = require('web-push');

// Configurar VAPID desde variables de entorno
webPush.setVapidDetails(
  'mailto:admin@rotiseria.com',
  process.env.VAPID_PUBLIC_KEY || 'BGF8Q3Y-V9P-uhfoEqGA3D0jUCJpm_kXX0rNXDt8noPYTEIbQJ_M_h7j2GWy0FzWpzzTlGppCC4Qkwc1I4jfYfk',
  process.env.VAPID_PRIVATE_KEY || 'FW1lleyYR1iRd72YIbWRjGN8BytVEo6QH8bf1EpS1a8'
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Autenticación: verificar API token si está configurado
  const API_TOKEN = process.env.PUSH_API_TOKEN;
  if (API_TOKEN) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || authHeader !== `Bearer ${API_TOKEN}`) {
      return res.status(401).json({ error: 'No autorizado' });
    }
  }

  try {
    const { subscription, payload } = req.body;

    // Validaciones
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Falta subscription.endpoint' });
    }

    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      return res.status(400).json({ error: 'Faltan keys.p256dh o keys.auth' });
    }

    if (!payload || !payload.title) {
      return res.status(400).json({ error: 'Falta payload.title' });
    }

    // Enviar notificación
    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body || '',
      icon: payload.icon || 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
      badge: payload.badge || 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
      tag: payload.tag || 'default',
      requireInteraction: payload.requireInteraction || false,
      data: payload.data || {}
    });

    await webPush.sendNotification(subscription, pushPayload);

    return res.status(200).json({ 
      success: true, 
      message: 'Notificación enviada' 
    });

  } catch (error) {
    console.error('Error enviando push:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
