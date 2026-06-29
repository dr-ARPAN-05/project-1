// Admin-only: create and manage promo codes
// Protected by checking is_admin in profiles table
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function isAdmin(userId) {
  const { data } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return data?.is_admin === true;
}

export default async function handler(req, res) {
  const userId = req.headers['x-user-id'];
  if (!userId || !(await isAdmin(userId))) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // GET — list all codes
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST — create code
  if (req.method === 'POST') {
    const { code, discount_pct, max_uses_total, max_uses_per_user, expires_at } = req.body;
    if (!code || !discount_pct) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await supabase.from('promo_codes').insert({
      code: code.toUpperCase().trim(),
      discount_pct: parseInt(discount_pct),
      max_uses_total: parseInt(max_uses_total) || 100,
      max_uses_per_user: parseInt(max_uses_per_user) || 1,
      expires_at: expires_at || null,
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // PATCH — toggle active/inactive
  if (req.method === 'PATCH') {
    const { id, active } = req.body;
    const { data, error } = await supabase
      .from('promo_codes')
      .update({ active })
      .eq('id', id)
      .select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // DELETE
  if (req.method === 'DELETE') {
    const { id } = req.body;
    await supabase.from('promo_codes').delete().eq('id', id);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
