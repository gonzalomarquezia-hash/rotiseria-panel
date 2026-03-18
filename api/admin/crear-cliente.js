const bcrypt = require('bcryptjs');

const MAESTRO_URL = process.env.MAESTRO_URL;
const MAESTRO_KEY = process.env.MAESTRO_SERVICE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  // Proteger con secret
  const authHeader = req.headers.authorization;
  if (!ADMIN_SECRET || !authHeader || authHeader !== `Bearer ${ADMIN_SECRET}`) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  const { nombre_negocio, slug, email, password, plan, canal_ntfy } = req.body || {};
  if (!nombre_negocio || !slug || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos: nombre_negocio, slug, email, password' });
  }

  // Verificar que no exista el slug
  const checkSlug = await fetch(
    `${MAESTRO_URL}/rest/v1/clientes?slug=eq.${encodeURIComponent(slug)}&select=id`,
    { headers: { 'apikey': MAESTRO_KEY, 'Authorization': `Bearer ${MAESTRO_KEY}` } }
  );
  const existentes = await checkSlug.json();
  if (existentes && existentes.length > 0) {
    return res.status(409).json({ error: `El slug "${slug}" ya existe` });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  // 1. Crear cliente
  const rCliente = await fetch(`${MAESTRO_URL}/rest/v1/clientes`, {
    method: 'POST',
    headers: {
      'apikey': MAESTRO_KEY,
      'Authorization': `Bearer ${MAESTRO_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      nombre_negocio,
      slug,
      email,
      password_hash,
      activo: true,
      plan: plan || 'basico',
      canal_ntfy: canal_ntfy || slug,
      supabase_url: MAESTRO_URL,
      supabase_anon_key: process.env.MAESTRO_ANON_KEY || '',
      created_at: now,
      updated_at: now
    })
  });

  const clienteRows = await rCliente.json();
  if (!rCliente.ok) {
    return res.status(500).json({ error: 'Error creando cliente', detalle: clienteRows });
  }

  // 2. Crear negocio vacío (el cliente completa el resto desde el panel)
  const rNegocio = await fetch(`${MAESTRO_URL}/rest/v1/negocios`, {
    method: 'POST',
    headers: {
      'apikey': MAESTRO_KEY,
      'Authorization': `Bearer ${MAESTRO_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      slug,
      nombre: nombre_negocio,
      tipo_negocio: 'negocio',
      estado_local: true,
      costo_delivery: 0,
      metodos_pago_json: [],
      datos_bancarios_json: {},
      horarios_json: [],
      ignorar_bot_json: [],
      created_at: now,
      updated_at: now
    })
  });

  const negocioRows = await rNegocio.json();
  if (!rNegocio.ok) {
    return res.status(500).json({ error: 'Cliente creado pero falló el negocio', detalle: negocioRows });
  }

  return res.status(201).json({
    ok: true,
    cliente: Array.isArray(clienteRows) ? clienteRows[0] : clienteRows,
    negocio: Array.isArray(negocioRows) ? negocioRows[0] : negocioRows
  });
};
