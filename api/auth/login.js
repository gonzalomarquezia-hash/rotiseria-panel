const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y password requeridos' });
  }

  // Buscar cliente activo en Maestro
  const r = await fetch(
    `${MAESTRO_URL}/rest/v1/clientes?email=eq.${encodeURIComponent(email)}&activo=eq.true&select=*`,
    {
      headers: {
        'apikey': MAESTRO_KEY,
        'Authorization': `Bearer ${MAESTRO_KEY}`
      }
    }
  );

  const clientes = await r.json();
  if (!clientes || clientes.length === 0) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const cliente = clientes[0];
  const ok = await bcrypt.compare(password, cliente.password_hash);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  // Crear sesión — 7 días
  const token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  await fetch(`${MAESTRO_URL}/rest/v1/sesiones_panel`, {
    method: 'POST',
    headers: {
      'apikey': MAESTRO_KEY,
      'Authorization': `Bearer ${MAESTRO_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cliente_id: cliente.id, token, expires_at })
  });

  return res.status(200).json({
    token,
    nombre_negocio: cliente.nombre_negocio,
    slug: cliente.slug,
    canal_ntfy: cliente.canal_ntfy,
    plan: cliente.plan
  });
};
