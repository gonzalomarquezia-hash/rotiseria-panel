const webPush = require('web-push');

// Configurar VAPID
webPush.setVapidDetails(
  'mailto:admin@rotiseria.com',
  'BGF8Q3Y-V9P-uhfoEqGA3D0jUCJpm_kXX0rNXDt8noPYTEIbQJ_M_h7j2GWy0FzWpzzTlGppCC4Qkwc1I4jfYfk',
  'FW1lleyYR1iRd72YIbWRjGN8BytVEo6QH8bf1EpS1a8'
);

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
