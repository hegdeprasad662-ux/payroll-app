import { getSettings, setSetting } from '../utils/settings.js';

export async function list(req, res) {
  res.json(await getSettings());
}
export async function update(req, res) {
  const { key, value } = req.body;
  if (!key) return res.status(400).json({ error: 'key required' });
  await setSetting(key, value);
  res.json({ ok: true });
}
