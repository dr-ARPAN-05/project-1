import { useState, useCallback } from 'react';
import {
  Users, Target, Video, MessageCircle,
  ClipboardList, Sparkles, ArrowRight,
} from 'lucide-react';
import { C, PLANS } from './config/constants';
import { Icon } from './components/common/Icon';
import { BookingModal } from './components/booking/BookingModal';

export default function App() {
  const [activePlan, setActivePlan] = useState(null);
  const openModal  = useCallback(plan => setActivePlan(plan), []);
  const closeModal = useCallback(() => setActivePlan(null), []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #080C1A; color: #E2E8F0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #080C1A; }
        ::-webkit-scrollbar-thumb { background: #1E2A4A; border-radius: 99px; }
        input::placeholder { color: #3A4560; }
      `}</style>

      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "'Inter', sans-serif", color: C.text, paddingBottom: 80 }}>

        {/* Pricing section */}
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 20px 20px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, color: C.white, marginBottom: 12 }}>
            NEET 2026 Strategy Mentorship
          </h2>
          <p style={{ color: C.muted, marginBottom: 40 }}>
            Accelerate your scores past the 650+ mark with custom structured guidance.
          </p>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {PLANS.map(plan => (
              <div
                key={plan.id}
                style={{
                  background: C.bgCard, border: `1px solid ${C.border}`,
                  padding: 32, borderRadius: 20, width: 340,
                  textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}
              >
                <div>
                  <h3 style={{ color: C.white, fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, marginBottom: 0 }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontSize: 24, fontWeight: 700, color: C.white, margin: '16px 0' }}>
                    ₹{plan.perSession} <span style={{ fontSize: 14, color: C.muted }}>/ session</span>
                  </p>
                  <p style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>{plan.desc}</p>
                </div>
                <button
                  onClick={() => openModal(plan)}
                  style={{
                    background: C.violet, color: C.white, width: '100%',
                    padding: 12, border: 'none', borderRadius: 10,
                    fontWeight: 600, cursor: 'pointer', fontSize: 14,
                  }}
                >
                  Select Plan
                </button>
              </div>
            ))}
          </div>
        </div>

        {activePlan && <BookingModal plan={activePlan} onClose={closeModal} />}
      </div>
    </>
  );
}
