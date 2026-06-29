import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount < 100) {
      // Allow 0 for 100% discount — create a ₹1 order (min Razorpay limit)
      // Frontend will handle free checkout separately
      return res.status(400).json({ error: 'Amount must be at least 100 paise' });
    }

    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      notes: notes || {},
    });

    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Razorpay create order error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
}
