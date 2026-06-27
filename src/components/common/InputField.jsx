import { useState } from 'react';
import { C } from '../../config/constants';

export function InputField({ label, type = 'text', value, onChange, placeholder, required, iconComp }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
        color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}{required && <span style={{ color: C.violet }}> *</span>}
      </label>

      <div style={{ position: 'relative' }}>
        {iconComp && (
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: C.muted, pointerEvents: 'none', display: 'flex',
          }}>
            {iconComp}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            background:   'rgba(255,255,255,0.04)',
            border:       `1.5px solid ${focused ? C.violet : C.border}`,
            borderRadius: 12,
            padding:      iconComp ? '12px 16px 12px 42px' : '12px 16px',
            fontFamily:   "'Inter', sans-serif",
            fontSize:     14.5,
            color:        C.white,
            outline:      'none',
            width:        '100%',
          }}
        />
      </div>
    </div>
  );
}
