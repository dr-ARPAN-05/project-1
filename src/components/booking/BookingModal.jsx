import { useState } from 'react';
import { X, AlertCircle, ArrowRight, User, Mail, Phone } from 'lucide-react';
import { C, CONFIG, BOOKED_DATES_MOCK } from '../../config/constants';
import { useRazorpaySDK } from '../../hooks/useRazorpaySDK';
import { Icon } from '../common/Icon';
import { InputField } from '../common/InputField';
import { SessionCalendar } from './SessionCalendar';
import { SuccessView } from './SuccessView';

export function BookingModal({ plan, onClose }) {
  const razorpayReady = useRazorpaySDK();

  const [step,         setStep]         = useState('form'); // 'form' | 'processing' | 'success'
  const [billingType,  setBillingType]  = useState('session');
  const [selectedDate, setSelectedDate] = useState(null);
  const [form,         setForm]         = useState({ name: '', email: '', phone: '' });
  const [errorMsg,     setErrorMsg]     = useState('');
  const [bookedDates,  setBookedDates]  = useState(BOOKED_DATES_MOCK);

  const amount = billingType === 'session' ? plan.perSession : plan.yearlyTotal;

  // ── Validation (same rules as original) ────────────────────────────────────
  const validate = () => {
    if (!form.name.trim())                                   return 'Please enter your full name.';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))    return 'Enter a valid email address.';
    if (!form.phone.match(/^[6-9]\d{9}$/))                  return 'Enter a valid 10-digit Indian mobile number.';
    if (billingType === 'session' && !selectedDate)          return 'Please select a session date.';
    return null;
  };

  // ── Payment handler — Promise-based so Razorpay modal doesn't deadlock ─────
  const handlePay = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    if (!razorpayReady) { setErrorMsg('Razorpay is still loading, try again in a moment.'); return; }

    setErrorMsg('');
    setStep('processing');

    try {
      // 1. Create order on backend (same-domain /api/create-order on Vercel)
      const orderRes = await fetch(`${CONFIG.BACKEND_URL}/api/create-order`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          amount:   amount * 100, // paise
          currency: 'INR',
          receipt:  `mentorship_${plan.id}_${Date.now()}`,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Could not create Razorpay order. Check backend.');
      }

      const { order_id, amount: orderAmount, currency } = await orderRes.json();

      // 2. Open Razorpay checkout — wrapped in a Promise so we await it cleanly
      const paymentResponse = await new Promise((resolve, reject) => {
        const options = {
          key:         CONFIG.RAZORPAY_KEY_ID,
          amount:      orderAmount,
          currency:    currency,
          name:        'NEET Mentor Pro',
          description: `${plan.name} Package Purchase`,
          order_id:    order_id,
          prefill: {
            name:    form.name,
            email:   form.email,
            contact: form.phone,
          },
          theme: {
            color: plan.featured ? C.violet : C.amber,
          },
          modal: {
            ondismiss: () => reject(new Error('Payment cancelled.')),
          },
          handler: response => resolve(response),
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', resp => {
          reject(new Error(resp.error.description || 'Transaction failed.'));
        });
        rzp.open();
      });

      // 3. Verify signature on backend
      const verifyRes = await fetch(`${CONFIG.BACKEND_URL}/api/verify-payment`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          razorpay_order_id:   paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature:  paymentResponse.razorpay_signature,
        }),
      });

      if (!verifyRes.ok) throw new Error('Signature validation failed. Contact support.');

      // Mark date as booked in local state
      if (billingType === 'session' && selectedDate)
        setBookedDates(prev => [...prev, selectedDate]);

      setStep('success');

    } catch (e) {
      setErrorMsg(e.message || 'Payment failed. Please try again.');
      setStep('form');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(5,8,20,0.85)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: C.bgCard, border: `1px solid ${C.border}`,
        borderRadius: 24, width: '100%', maxWidth: 480,
        padding: 28, position: 'relative',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: C.muted, cursor: 'pointer' }}
        >
          <Icon icon={X} size={20} />
        </button>

        {/* ── SUCCESS ── */}
        {step === 'success' && <SuccessView onClose={onClose} />}

        {/* ── FORM / PROCESSING ── */}
        {step !== 'success' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Header */}
            <div>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 700, color: C.white, marginBottom: 4 }}>
                Book {plan.name}
              </h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
                {plan.desc}
              </p>
            </div>

            {/* Billing toggle */}
            <div style={{
              display: 'flex', background: 'rgba(255,255,255,0.02)',
              border: `1px solid ${C.border}`, borderRadius: 12, padding: 4,
            }}>
              <button
                onClick={() => setBillingType('session')}
                style={{
                  flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                  background: billingType === 'session' ? C.violet : 'transparent',
                  color: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Per Session
              </button>
              <button
                onClick={() => setBillingType('yearly')}
                style={{
                  flex: 1, padding: '8px 12px', border: 'none', borderRadius: 8,
                  background: billingType === 'yearly' ? C.violet : 'transparent',
                  color: C.white, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                }}
              >
                Yearly Focus
              </button>
            </div>

            {/* Form fields */}
            <InputField
              label="Full Name" value={form.name} required
              onChange={v => setForm(p => ({ ...p, name: v }))}
              placeholder="Arpan"
              iconComp={<Icon icon={User} size={16} />}
            />
            <InputField
              label="Email Address" type="email" value={form.email} required
              onChange={v => setForm(p => ({ ...p, email: v }))}
              placeholder="you@domain.com"
              iconComp={<Icon icon={Mail} size={16} />}
            />
            <InputField
              label="Phone Number" type="tel" value={form.phone} required
              onChange={v => setForm(p => ({ ...p, phone: v }))}
              placeholder="9876543210"
              iconComp={<Icon icon={Phone} size={16} />}
            />

            {/* Calendar (per-session only) */}
            {billingType === 'session' && (
              <div>
                <label style={{
                  display: 'block', fontSize: 12, fontWeight: 600, color: C.muted,
                  letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8,
                }}>
                  Select Session Date *
                </label>
                <SessionCalendar
                  bookedDates={bookedDates}
                  selectedDate={selectedDate}
                  onSelect={setSelectedDate}
                />
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div style={{
                display: 'flex', gap: 8, alignItems: 'center',
                color: C.red, background: 'rgba(239,68,68,0.08)',
                padding: 12, borderRadius: 10, fontSize: 13,
              }}>
                <Icon icon={AlertCircle} size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Pay button */}
            <button
              onClick={handlePay}
              disabled={step === 'processing'}
              style={{
                background:    `linear-gradient(135deg, ${C.violet}, ${C.violetLight})`,
                color:         C.white, padding: '14px', border: 'none',
                borderRadius:  12, fontWeight: 700, fontSize: 15,
                cursor:        step === 'processing' ? 'not-allowed' : 'pointer',
                display:       'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow:     '0 4px 20px rgba(124,58,237,0.3)',
                opacity:       step === 'processing' ? 0.7 : 1,
              }}
            >
              {step === 'processing' ? 'Connecting Razorpay...' : `Securely Pay ₹${amount}`}
              {step !== 'processing' && <Icon icon={ArrowRight} size={16} />}
            </button>

          </div>
        )}
      </div>
    </div>
  );
}
