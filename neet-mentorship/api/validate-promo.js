import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service role — can bypass RLS
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, user_id } = req.body;
  if (!code || !user_id) return res.status(400).json({ error: 'Missing code or user_id' });

  // Find active code
  const { data: promo, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('active', true)
    .single();

  if (error || !promo) return res.status(404).json({ error: 'Invalid or expired promo code' });

  // Check expiry
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return res.status(400).json({ error: 'This promo code has expired' });
  }

  // Check total uses
  if (promo.uses_so_far >= promo.max_uses_total) {
    return res.status(400).json({ error: 'This promo code has reached its maximum uses' });
  }

  // Check per-user uses
  const { count } = await supabase
    .from('promo_uses')
    .select('*', { count: 'exact', head: true })
    .eq('code_id', promo.id)
    .eq('user_id', user_id);

  if (count >= promo.max_uses_per_user) {
    return res.status(400).json({ error: `You've already used this code ${promo.max_uses_per_user === 1 ? 'once' : `${promo.max_uses_per_user} times`}` });
  }

  return res.status(200).json({
    valid: true,
    discount_pct: promo.discount_pct,
    code_id: promo.id,
    message: `${promo.discount_pct}% off applied!`,
  });
}
