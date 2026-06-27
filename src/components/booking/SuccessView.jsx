import { CheckCircle2 } from 'lucide-react';
import { C } from '../../config/constants';
import { Icon } from '../common/Icon';

export function SuccessView({ onClose }) {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'rgba(16,185,129,0.12)', border: '1.5px solid rgba(16,185,129,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <Icon icon={CheckCircle2} size={30} color={C.green} />
      </div>

      <h3 style={{
        fontFamily: "'Space Grotesk', sans-serif", fontSize: 22,
        fontWeight: 800, color: C.white, margin: '0 0 8px',
      }}>
        You're booked!
      </h3>

      <p style={{
        fontFamily: "'Inter', sans-serif", fontSize: 14,
        color: C.muted, lineHeight: 1.6, margin: '0 0 24px',
      }}>
        Payment verified safely. Your allocation is confirmed.
      </p>

      <button
        onClick={onClose}
        style={{
          width: '100%', padding: '12px 24px',
          background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
          borderRadius: 999, cursor: 'pointer', color: C.text,
          fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600,
        }}
      >
        Done
      </button>
    </div>
  );
}
