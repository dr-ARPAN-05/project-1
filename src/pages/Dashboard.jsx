import { useEffect, useState } from 'react';
import { Users, Clock, Settings, MessageCircle, ArrowRight, CalendarClock } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../lib/supabaseClient';
import { buildSessionInstances } from '../lib/sessionInstances';
import PurchaseCard from '../components/dashboard/PurchaseCard.jsx';
import SessionInstanceRow from '../components/dashboard/SessionInstanceRow.jsx';
import CompleteBookingModal from '../components/dashboard/CompleteBookingModal.jsx';
import AdminGroupSessions from '../components/dashboard/AdminGroupSessions.jsx';
import AdminBlockedSlots from '../components/dashboard/AdminBlockedSlots.jsx';
import AdminAllPurchases from '../components/dashboard/AdminAllPurchases.jsx';
import OnboardingModal from '../components/dashboard/OnboardingModal.jsx';
import SEO from '../components/SEO.jsx';

const ADMIN_TABS = [
  { id: 'admin_group', label: 'Group Sessions', icon: Users },
  { id: 'admin_blocked', label: 'Block Slots', icon: Clock },
  { id: 'admin_purchases', label: 'All Purchases', icon: Settings },
];

const CONTACT_PHONE = import.meta.env.VITE_CONTACT_PHONE || '';
const WHATSAPP_DIGITS = CONTACT_PHONE.replace(/\D/g, '');

// Auth is already resolved by the time this renders — App.jsx wraps this
// route in <ProtectedRoute>. is_admin and the profile come from the SAME
// shared account used on arpansarkar.org — nothing local to set up here.
export default function Dashboard() {
  const { session, profile, isAdmin, signOut, needsOnboarding, refreshProfile } = useAuth();
  const [tab, setTab] = useState('mentorship');
  const [purchases, setPurchases] = useState([]);
  const [groupSessions, setGroupSessions] = useState([]);
  const [plansByKey, setPlansByKey] = useState({});
  const [loading, setLoading] = useState(true);
  const [bookingFor, setBookingFor] = useState(null);

  useEffect(() => {
    Promise.all([
      supabase
        .from('purchases')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('product', 'mentorship')
        .eq('status', 'paid')
        .order('created_at', { ascending: false }),
      supabase.from('group_sessions').select('*'),
      supabase.from('plans').select('*'),
    ]).then(([purchasesRes, groupRes, plansRes]) => {
      setPurchases(purchasesRes.data || []);
      setGroupSessions(groupRes.data || []);
      setPlansByKey(Object.fromEntries((plansRes.data || []).map((p) => [p.plan_key, p])));
      setLoading(false);
    });
  }, [session.user.id]);

  const handleBookingSaved = (updated) => {
    setPurchases((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));
    setBookingFor(null);
  };

  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  const needsBooking = purchases.filter(
    (p) =>
      plansByKey[p.plan_key]?.schedule_type !== 'admin_sets' &&
      !p.scheduled_date &&
      (p.weekly_day === null || p.weekly_day === undefined)
  );
  const { past, today, upcoming } = buildSessionInstances(purchases, groupSessions, plansByKey);

  return (
    <div className="min-h-screen bg-base">
      <SEO title="Dashboard — ArpanMentors" path="/dashboard" noindex />

      <div className="flex flex-col md:flex-row">
        <aside className="border-b border-line md:min-h-screen md:w-60 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between px-5 py-5 md:block">
            <p className="font-display text-lg font-bold text-white">
              Arpan<span className="text-amber">Mentors</span>
            </p>
            <button
              onClick={signOut}
              className="rounded-full border border-line px-3 py-1.5 text-xs text-white/60 hover:border-violet/50 hover:text-white md:hidden"
            >
              Sign out
            </button>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:px-3">
            <p className="hidden px-2 pb-1 text-[11px] uppercase tracking-wider text-white/30 md:block">
              My Account
            </p>
            <button
              onClick={() => setTab('mentorship')}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                tab === 'mentorship' ? 'bg-violet/15 text-lavender' : 'text-white/60 hover:bg-panel hover:text-white'
              }`}
            >
              <CalendarClock size={15} /> My Mentorship
            </button>

            {isAdmin && (
              <>
                <p className="hidden px-2 pb-1 pt-3 text-[11px] uppercase tracking-wider text-white/30 md:block">
                  Admin
                </p>
                {ADMIN_TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      tab === t.id ? 'bg-violet/15 text-lavender' : 'text-white/60 hover:bg-panel hover:text-white'
                    }`}
                  >
                    <t.icon size={15} /> {t.label}
                  </button>
                ))}
              </>
            )}
          </nav>

          <div className="hidden items-center gap-2 border-t border-line px-5 py-4 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet text-xs font-semibold text-white">
              {(profile?.full_name || session.user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-white">{profile?.full_name || 'You'}</div>
              <div className="truncate text-xs text-white/40">{session.user.email}</div>
            </div>
            <button onClick={signOut} className="text-white/30 hover:text-white" title="Sign out">
              ⎋
            </button>
          </div>
        </aside>

        <main className="flex-1 px-5 py-8 md:px-10 md:py-10">
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet border-t-transparent" />
          ) : (
            <>
              {tab === 'mentorship' && (
                <MentorshipTab
                  firstName={firstName}
                  hasAnyPurchase={purchases.length > 0}
                  needsBooking={needsBooking}
                  plansByKey={plansByKey}
                  past={past}
                  today={today}
                  upcoming={upcoming}
                  onCompleteBooking={setBookingFor}
                />
              )}
              {isAdmin && tab === 'admin_group' && <AdminGroupSessions />}
              {isAdmin && tab === 'admin_blocked' && <AdminBlockedSlots />}
              {isAdmin && tab === 'admin_purchases' && <AdminAllPurchases />}
            </>
          )}
        </main>
      </div>

      {bookingFor && (
        <CompleteBookingModal
          purchase={bookingFor}
          plan={plansByKey[bookingFor.plan_key]}
          onClose={() => setBookingFor(null)}
          onSaved={handleBookingSaved}
        />
      )}

      {needsOnboarding && (
        <OnboardingModal
          userId={session.user.id}
          prefillName={session.user.user_metadata?.full_name || ''}
          onSaved={refreshProfile}
        />
      )}
    </div>
  );
}

function MentorshipTab({ firstName, hasAnyPurchase, needsBooking, plansByKey, past, today, upcoming, onCompleteBooking }) {
  if (!hasAnyPurchase) {
    return (
      <div>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">Hey {firstName} 👋</h1>
        <p className="mt-1 text-sm text-white/50">Here's your mentorship hub.</p>
        <EmptyState />
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white md:text-3xl">Hey {firstName} 👋</h1>
      <p className="mt-1 text-sm text-white/50">Here's what's coming up.</p>

      {needsBooking.length > 0 && (
        <div className="mt-6 space-y-3">
          {needsBooking.map((p) => (
            <PurchaseCard key={p.id} purchase={p} plan={plansByKey[p.plan_key]} onCompleteBooking={onCompleteBooking} />
          ))}
        </div>
      )}

      <SessionRow title="Past sessions" instances={past} emptyLabel="No past sessions exist" />
      <SessionRow title="Scheduled today" instances={today} emptyLabel="No sessions today" />
      <SessionRow
        title="Upcoming sessions"
        instances={upcoming}
        emptyLabel="No upcoming sessions for now. Book one today!"
      />
    </div>
  );
}

function SessionRow({ title, instances, emptyLabel }) {
  return (
    <div className="mt-8">
      <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white/50">{title}</h2>
      {instances.length === 0 ? (
        <p className="rounded-xl border border-line bg-panel/50 px-4 py-4 text-sm text-white/40">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">
          {instances.map((inst) => (
            <SessionInstanceRow key={inst.id} instance={inst} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-10 rounded-2xl border border-line bg-panel px-6 py-12 text-center">
      <CalendarClock size={26} className="mx-auto text-white/25" />
      <h3 className="mt-3 font-display font-semibold text-white">No active plan yet</h3>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-white/45">
        Grab a mentorship plan on arpansarkar.org — it'll unlock right here as soon as payment goes through.
      </p>
      <a
        href="https://www.arpansarkar.org/plans"
        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft"
      >
        View plans <ArrowRight size={14} />
      </a>
      {WHATSAPP_DIGITS && (
        <a
          href={`https://wa.me/${WHATSAPP_DIGITS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex items-center justify-center gap-1.5 text-xs text-white/40 hover:text-white/70"
        >
          <MessageCircle size={12} /> Or ask a question on WhatsApp
        </a>
      )}
    </div>
  );
}
