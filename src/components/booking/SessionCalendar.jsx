import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { C, MONTH_NAMES, DAY_NAMES, toYMD } from '../../config/constants';
import { Icon } from '../common/Icon';

export function SessionCalendar({ bookedDates, selectedDate, onSelect }) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const bookedSet  = useMemo(() => new Set(bookedDates), [bookedDates]);
  const canGoPrev  = viewYear > today.getFullYear() || viewMonth > today.getMonth();

  function prevMonth() {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  const cells = useMemo(() => {
    const firstDay    = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const grid = [];
    for (let i = 0; i < firstDay; i++) grid.push(null);
    for (let d = 1; d <= daysInMonth; d++) grid.push(d);
    return grid;
  }, [viewYear, viewMonth]);

  function getDayState(day) {
    if (!day) return 'empty';
    const d   = new Date(viewYear, viewMonth, day);
    const dow = d.getDay();
    if (d < today)                       return 'past';
    if (dow === 0 || dow === 6)          return 'weekend';
    if (bookedSet.has(toYMD(d)))        return 'booked';
    return 'available';
  }

  const stateStyles = {
    empty:     { bg: 'transparent',             color: 'transparent', border: 'none',                               cursor: 'default'     },
    past:      { bg: 'transparent',             color: C.slate,       border: '1px solid transparent',              cursor: 'not-allowed' },
    weekend:   { bg: 'rgba(51,65,85,0.25)',     color: C.slate,       border: '1px solid rgba(51,65,85,0.3)',       cursor: 'not-allowed' },
    booked:    { bg: 'rgba(239,68,68,0.12)',    color: '#FCA5A5',     border: '1px solid rgba(239,68,68,0.35)',     cursor: 'not-allowed' },
    available: { bg: 'rgba(16,185,129,0.1)',    color: '#6EE7B7',     border: '1px solid rgba(16,185,129,0.3)',     cursor: 'pointer'     },
  };

  return (
    <div style={{ userSelect: 'none' }}>

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          disabled={!canGoPrev}
          style={{
            background:   canGoPrev ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
            border:       `1px solid ${canGoPrev ? C.border : 'transparent'}`,
            borderRadius: 8, width: 32, height: 32,
            cursor:       canGoPrev ? 'pointer' : 'not-allowed',
            color:        canGoPrev ? C.text : C.slate,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon icon={ChevronLeft} size={16} />
        </button>

        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 15, color: C.white }}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          style={{
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
            borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: C.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Icon icon={ChevronRight} size={16} />
        </button>
      </div>

      {/* Day-name headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
        {DAY_NAMES.map(d => (
          <div key={d} style={{
            textAlign: 'center', fontSize: 11, fontWeight: 700,
            color: d === 'Sun' || d === 'Sat' ? C.slate : C.muted,
            fontFamily: "'Inter', sans-serif", letterSpacing: '0.05em', padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((day, i) => {
          const state      = getDayState(day);
          const ymd        = day ? toYMD(new Date(viewYear, viewMonth, day)) : null;
          const isSelected = ymd && selectedDate === ymd;
          const s          = stateStyles[state];

          return (
            <div
              key={i}
              onClick={() => { if (state === 'available' && ymd) onSelect(ymd); }}
              style={{
                aspectRatio:  '1',
                display:      'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                fontFamily:   "'Inter', sans-serif",
                cursor:       s.cursor,
                background:   isSelected ? `linear-gradient(135deg, ${C.violet}, ${C.violetLight})` : s.bg,
                color:        isSelected ? C.white : s.color,
                border:       isSelected ? 'none' : s.border,
                boxShadow:    isSelected ? '0 0 16px rgba(124,58,237,0.5)' : 'none',
                transition:   'background 0.15s, transform 0.15s, box-shadow 0.15s',
                transform:    isSelected ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              {day || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
