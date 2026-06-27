// ── Backend URL: empty string = same domain on Vercel (no CORS issues) ───────
export const CONFIG = {
  BACKEND_URL: '',
  RAZORPAY_KEY_ID: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_T6FCzuCkCgC8xV',
};

// ── Color tokens ─────────────────────────────────────────────────────────────
export const C = {
  bg:          '#080C1A',
  bgCard:      '#0E1428',
  border:      '#1E2A4A',
  violet:      '#7C3AED',
  violetLight: '#9F67FF',
  violetGlow:  'rgba(124,58,237,0.15)',
  lavender:    '#C4B5FD',
  amber:       '#F59E0B',
  amberGlow:   'rgba(245,158,11,0.12)',
  white:       '#FFFFFF',
  muted:       '#6B7A99',
  text:        '#E2E8F0',
  green:       '#10B981',
  red:         '#EF4444',
  slate:       '#475569',
};

// ── Calendar helpers ──────────────────────────────────────────────────────────
export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
export const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function toYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── Mock booked dates (replace with real DB later) ────────────────────────────
export const BOOKED_DATES_MOCK = (() => {
  const today = new Date();
  const dates = [];
  [3, 7, 10, 14, 17, 21, 25, 28, 32, 38].forEach(offset => {
    const d = new Date(today);
    d.setDate(today.getDate() + offset);
    if (d.getDay() !== 0 && d.getDay() !== 6)
      dates.push(d.toISOString().slice(0, 10));
  });
  return dates;
})();

// ── Plans data ────────────────────────────────────────────────────────────────
export const PLANS = [
  {
    id: 'group', name: 'Group Mentorship',
    perSession: 199, yearlyTotal: 199 * 52,
    color: 'amber', featured: false, totalSpots: 15, takenSpots: 9,
    desc: 'Weekly group session with a driven NEET cohort.',
    features: [
      { text: 'Weekly 1-hour group session' },
      { text: 'Shared doubt-clearing time'  },
    ],
  },
  {
    id: 'personal', name: 'Personal Mentorship',
    perSession: 1000, yearlyTotal: 1000 * 52,
    color: 'violet', featured: true, totalSpots: 13, takenSpots: 7,
    desc: 'Dedicated 1-on-1 strategy built entirely around you.',
    features: [
      { text: 'Weekly 60-min 1:1 session'  },
      { text: 'Personalised study plan'    },
    ],
  },
];
