import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id:    process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // CORS headers (needed if you ever call from a different subdomain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'Method not allowed' });

  const url = req.url || '';

  // ── POST /api/create-order ───────────────────────────────────────────────
  if (url.includes('create-order')) {
    try {
      const { amount, currency, receipt } = req.body;

      if (!amount || amount < 100)
        return res.status(400).json({ error: 'Amount must be >= 100 paise' });

      const order = await razorpay.orders.create({
        amount,
        currency: currency || 'INR',
        receipt:  receipt  || `receipt_${Date.now()}`,
      });

      return res.status(200).json({
        order_id: order.id,
        amount:   order.amount,
        currency: order.currency,
      });
    } catch (err) {
      console.error('create-order error:', err);
      return res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
  }

  // ── POST /api/verify-payment ─────────────────────────────────────────────
  if (url.includes('verify-payment')) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature)
      return res.status(400).json({ error: 'Missing required fields' });

    const generated = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated === razorpay_signature)
      return res.status(200).json({ success: true, order_id: razorpay_order_id });
    else
      return res.status(400).json({ success: false, error: 'Invalid signature' });
  }

  return res.status(404).json({ error: 'Unknown API route' });
}
