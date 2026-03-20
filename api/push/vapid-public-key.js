module.exports = (req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return res.status(500).json({ error: 'VAPID no configurado' });
  return res.status(200).json({ publicKey: key });
};
