// ─── Slot definitions (fixed — no student choice) ────────────
// personal_session (one-time):     7:45–8:15 PM  → one slot per day
// personal_monthly/yearly/ghost:   6:00–6:30 PM  OR  6:30–7:00 PM  → 2 slots per day (first-come)
// group (all):                     7:00–7:40 PM  → admin sets date, no slot choice

export const FIXED_SLOTS = {
  // key → { label, start, end }
  personal_session: [
    { key: '19:45', label: '7:45 – 8:15 PM', start: '19:45', end: '20:15' },
  ],
  personal_weekly: [
    { key: '18:00', label: '6:00 – 6:30 PM', start: '18:00', end: '18:30' },
    { key: '18:30', label: '6:30 – 7:00 PM', start: '18:30', end: '19:00' },
  ],
  group: [
    { key: '19:00', label: '7:00 – 7:40 PM', start: '19:00', end: '19:40' },
  ],
};

// Which slot group does each plan use?
export function getSlotsForPlan(planKey) {
  if (planKey === 'personal_session') return FIXED_SLOTS.personal_session;
  if (['personal_monthly','personal_yearly','ghost_deal'].includes(planKey)) return FIXED_SLOTS.personal_weekly;
  return FIXED_SLOTS.group; // group_session, group_monthly
}

export const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

// Ghost deal pricing: starts Dec 1, drops 15% each month, hides after May
export function getGhostDealPrice() {
  const now = new Date();
  const month = now.getMonth();
  const BASE = Math.round(999 * 5 * 0.80); // ₹3,996
  const DROP_PER_MONTH = 0.15;
  const monthOffset = { 11: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 };
  if (!(month in monthOffset)) return null;
  const discount = monthOffset[month] * DROP_PER_MONTH;
  const price = Math.round(BASE * (1 - discount));
  const monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month];
  const discountPct = Math.round(discount * 100);
  return { price, discountPct, monthName, base: BASE };
}

export const PLANS = {
  personal_session: {
    key: 'personal_session',
    name: 'Personal Session',
    price: 499,
    billing: 'one_time',
    tagline: 'One-time 1-on-1 · 7:45–8:15 PM · you pick the date',
    features: [
      'You choose any available date',
      '30-min 1-on-1 Zoom (7:45–8:15 PM)',
      'Personalised strategy & doubt-clearing',
      'WhatsApp follow-up after session',
      'Session recording shared post-call',
    ],
    scheduleType: 'pick_date',
    icon: 'user', accent: 'amber',
  },
  group_session: {
    key: 'group_session',
    name: 'Group Session',
    price: 199,
    billing: 'one_time',
    tagline: 'Shared session · 7:00–7:40 PM · Arpan sets the date',
    features: [
      'Arpan schedules the session date',
      '40-min group Zoom (7:00–7:40 PM)',
      'Batch Q&A and strategy discussion',
      'WhatsApp group access',
      'Session recording shared',
    ],
    scheduleType: 'admin_sets',
    icon: 'users', accent: 'violet',
  },
  personal_monthly: {
    key: 'personal_monthly',
    name: 'Personal Monthly',
    price: 999,
    billing: 'monthly',
    tagline: '4 sessions/mo · 6:00 or 6:30 PM · you pick the day',
    features: [
      'Pick your day of week (Mon–Sat)',
      '30-min 1-on-1 Zoom every week',
      'Slots: 6:00–6:30 PM or 6:30–7:00 PM',
      'Personalised monthly roadmap',
      'Direct WhatsApp access',
      'Mock test analysis each session',
    ],
    scheduleType: 'pick_weekly',
    icon: 'user', accent: 'amber',
  },
  personal_yearly: {
    key: 'personal_yearly',
    name: 'Personal Yearly',
    price: 9999,
    billing: 'yearly',
    originalPrice: 999 * 12,
    discountPct: 17,
    tagline: '52 sessions · 6:00 or 6:30 PM · save 17%',
    features: [
      'Everything in Monthly plan',
      '52 sessions over the full year',
      'Save ₹989 vs monthly billing',
      'Priority slot selection',
      'Yearly progress review with Arpan',
      'First access to new resources',
    ],
    scheduleType: 'pick_weekly',
    icon: 'user', accent: 'amber',
  },
  group_monthly: {
    key: 'group_monthly',
    name: 'Group Monthly',
    price: 399,
    billing: 'monthly',
    tagline: '4 sessions/mo · 7:00–7:40 PM · Arpan sets the day',
    features: [
      'Arpan schedules the weekly day',
      '40-min group Zoom (7:00–7:40 PM) every week',
      'Shared batch strategy sessions',
      'WhatsApp group community',
      'Recorded sessions for replay',
      'Monthly mock discussion',
    ],
    scheduleType: 'admin_sets',
    icon: 'users', accent: 'violet',
  },
};

// Flat slot label map for Dashboard display (keyed by slot key)
export const SLOT_LABELS = {
  '19:45': '7:45 – 8:15 PM',
  '18:00': '6:00 – 6:30 PM',
  '18:30': '6:30 – 7:00 PM',
  '19:00': '7:00 – 7:40 PM',
};
