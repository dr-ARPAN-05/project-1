import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { getSlotsForPlan, DAYS } from '../../lib/plans';

function fmt(date) {
  return date.toISOString().split('T')[0];
}
function displayDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Next 60 days, skip Sundays
function getAvailableDates() {
  const dates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 0) dates.push(d);
  }
  return dates;
}

/**
 * Lets a student pick their date/slot (personal_session) or weekly day/slot
 * (personal_monthly/yearly/ghost_deal) for a purchase that's ALREADY paid —
 * no payment happens here. Saves directly to the purchase row they own.
 * group_session/group_monthly plans don't need this — Arpan sets those.
 */
export default function CompleteBookingModal({ purchase, onClose, onSaved }) {
  const scheduleType = ['personal_monthly', 'personal_yearly', 'ghost_deal'].includes(purchase.plan_key)
    ? 'pick_weekly'
    : 'pick_date';
  const isPickDate = scheduleType === 'pick_date';
  const slots = getSlotsForPlan(purchase.plan_key);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [blockedDates, setBlockedDates] = useState([]);
  const [takenSlots, setTakenSlots] = useState([]);
  const [takenDays, setTakenDays] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const availableDates = getAvailableDates();

  useEffect(() => {
    supabase
      .from('blocked_slots')
      .select('blocked_date, slot')
      .then(({ data }) => setBlockedDates((data || []).filter((b) => !b.slot).map((b) => b.blocked_date)));

    if (isPickDate) {
      supabase
        .from('purchases')
        .select('scheduled_date, scheduled_slot')
        .eq('plan_key', 'personal_session')
        .eq('status', 'paid')
        .then(({ data }) => setTakenSlots(data || []));
    } else {
      supabase
        .from('purchases')
        .select('weekly_day, weekly_slot')
        .in('plan_key', ['personal_monthly', 'personal_yearly', 'ghost_deal'])
        .eq('status', 'paid')
        .then(({ data }) => setTakenDays(data || []));
    }
  }, [isPickDate]);

  const isDateBlocked = (date) => blockedDates.includes(fmt(date));
  const isDateSlotTaken = (date, slotKey) =>
    takenSlots.some((t) => t.scheduled_date === fmt(date) && t.scheduled_slot === slotKey);
  const isDaySlotTaken = (day, slotKey) => takenDays.some((t) => t.weekly_day === day && t.weekly_slot === slotKey);
  const availableSlotsForDate = (date) => (date ? slots.filter((s) => !isDateSlotTaken(date, s.key)) : slots);

  const canSave = isPickDate ? selectedDate && selectedSlot : selectedDay !== null && selectedSlot;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const update = isPickDate
        ? { scheduled_date: fmt(selectedDate), scheduled_slot: selectedSlot }
        : { weekly_day: selectedDay, weekly_slot: selectedSlot };

      const { data, error: err } = await supabase
        .from('purchases')
        .update(update)
        .eq('id', purchase.id)
        .select()
        .single();
      if (err) throw err;
      onSaved(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-line bg-panel p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-white">Pick your slot</h2>
              <p className="mt-1 text-sm text-white/50">{purchase.plan_name}</p>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X size={18} />
            </button>
          </div>

          {isPickDate && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                <Calendar size={13} /> Choose a date
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableDates.slice(0, 20).map((d) => {
                  const blocked = isDateBlocked(d) || availableSlotsForDate(d).length === 0;
                  return (
                    <button
                      key={fmt(d)}
                      disabled={blocked}
                      onClick={() => {
                        setSelectedDate(d);
                        setSelectedSlot(null);
                      }}
                      className={`rounded-lg border px-2 py-2 text-center text-xs transition ${
                        blocked
                          ? 'cursor-not-allowed border-line/50 text-white/20'
                          : selectedDate && fmt(selectedDate) === fmt(d)
                            ? 'border-violet bg-violet/15 text-white'
                            : 'border-line text-white/60 hover:border-violet/40'
                      }`}
                    >
                      <div>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                      <div className="font-semibold">{d.getDate()}</div>
                    </button>
                  );
                })}
              </div>

              {selectedDate && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                    <Clock size={13} /> Session slot
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSlotsForDate(selectedDate).map((s) => (
                      <button
                        key={s.key}
                        onClick={() => setSelectedSlot(s.key)}
                        className={`rounded-lg border px-3 py-2 text-xs transition ${
                          selectedSlot === s.key ? 'border-violet bg-violet/15 text-white' : 'border-line text-white/60 hover:border-violet/40'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!isPickDate && (
            <div className="mt-5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                <Calendar size={13} /> Pick your weekly day
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((d) => {
                  const allTaken = slots.every((s) => isDaySlotTaken(d, s.key));
                  return (
                    <button
                      key={d}
                      disabled={allTaken}
                      onClick={() => {
                        setSelectedDay(d);
                        setSelectedSlot(null);
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs transition ${
                        allTaken
                          ? 'cursor-not-allowed border-line/50 text-white/20'
                          : selectedDay === d
                            ? 'border-violet bg-violet/15 text-white'
                            : 'border-line text-white/60 hover:border-violet/40'
                      }`}
                    >
                      {DAYS[d].slice(0, 3)}
                    </button>
                  );
                })}
              </div>

              {selectedDay !== null && (
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/50">
                    <Clock size={13} /> Pick your time slot
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slots.map((s) => {
                      const taken = isDaySlotTaken(selectedDay, s.key);
                      return (
                        <button
                          key={s.key}
                          disabled={taken}
                          onClick={() => setSelectedSlot(s.key)}
                          className={`rounded-lg border px-3 py-2 text-xs transition ${
                            taken
                              ? 'cursor-not-allowed border-line/50 text-white/20'
                              : selectedSlot === s.key
                                ? 'border-violet bg-violet/15 text-white'
                                : 'border-line text-white/60 hover:border-violet/40'
                          }`}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="mt-6 w-full rounded-lg bg-violet py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Confirm slot'}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
