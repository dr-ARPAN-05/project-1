import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Tag,
  LogOut, Calendar, Video, MessageCircle, Clock,
  CheckCircle, Package, User, Zap, ArrowRight,
  Users, Shield, Settings, ChevronDown, ChevronUp,
  Plus, Trash2, Check, X, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { DAYS, SLOT_LABELS } from '../lib/plans';
import './Dashboard.css';

const WHATSAPP = '919999999999';

// ── Sidebar nav ────────────────────────────────────────────
const USER_TABS = [
  { id: 'overview', label: 'Overview', icon: Package },
  { id: 'sessions', label: 'My Sessions', icon: Calendar },
];
const ADMIN_TABS = [
  { id: 'admin_group', label: 'Group Sessions', icon: Users },
  { id: 'admin_blocked', label: 'Block Slots', icon: Clock },
  { id: 'admin_toppers', label: 'Topper Apps', icon: Shield },
  { id: 'admin_purchases', label: 'All Purchases', icon: Settings },
  { id: 'admin_promos', label: 'Promo Codes', icon: Tag },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const [{ data: profile }, { data: purch }] = await Promise.all([
        supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
        supabase.from('purchases').select('*').eq('user_id', user.id).eq('status','paid').order('created_at',{ascending:false}),
      ]);
      setIsAdmin(profile?.is_admin || false);
      setPurchases(purch || []);
      setLoading(false);
    }
    load();
  }, [user]);

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Aspirant';
  const avatar = user?.user_metadata?.avatar_url;
  const firstName = name.split(' ')[0];

  const allTabs = [...USER_TABS, ...(isAdmin ? ADMIN_TABS : [])];

  return (
    <div className="dashboard">
      <aside className="dash-sidebar">
        <div className="dash-logo">
          <Zap size={18} fill="currentColor" />
          <span>Arpan<span className="logo-accent">Mentors</span></span>
        </div>

        <nav className="dash-nav">
          <div className="dash-nav-section">My Account</div>
          {USER_TABS.map(t => (
            <button key={t.id} className={`dash-nav-item ${tab===t.id?'active':''}`} onClick={() => setTab(t.id)}>
              <t.icon size={16} />{t.label}
            </button>
          ))}

          {isAdmin && (
            <>
              <div className="dash-nav-section admin-section">Admin</div>
              {ADMIN_TABS.map(t => (
                <button key={t.id} className={`dash-nav-item ${tab===t.id?'active':''} admin-nav-item`} onClick={() => setTab(t.id)}>
                  <t.icon size={16} />{t.label}
                </button>
              ))}
            </>
          )}
        </nav>

        <div className="dash-user">
          {avatar
            ? <img src={avatar} alt={name} className="dash-avatar" />
            : <div className="dash-avatar-placeholder"><User size={18}/></div>
          }
          <div className="dash-user-info">
            <div className="dash-user-name">{name}</div>
            <div className="dash-user-email">{user?.email}</div>
          </div>
          <button className="dash-signout" onClick={signOut} title="Sign out"><LogOut size={16}/></button>
        </div>
      </aside>

      <main className="dash-main">
        {loading ? (
          <div className="dash-loading"><div className="spinner"/></div>
        ) : (
          <>
            {tab === 'overview' && <OverviewTab purchases={purchases} firstName={firstName} />}
            {tab === 'sessions' && <SessionsTab purchases={purchases} />}
            {isAdmin && tab === 'admin_group' && <AdminGroupSessions />}
            {isAdmin && tab === 'admin_blocked' && <AdminBlockedSlots />}
            {isAdmin && tab === 'admin_toppers' && <AdminTopperApps />}
            {isAdmin && tab === 'admin_purchases' && <AdminAllPurchases />}
            {isAdmin && tab === 'admin_promos' && <AdminPromos userId={user?.id} />}
          </>
        )}
      </main>
    </div>
  );
}

// ── Overview tab ───────────────────────────────────────────
function OverviewTab({ purchases, firstName }) {
  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">Hey {firstName} 👋</h1>
        <p className="dash-subtext">Here's your mentorship hub.</p>
      </div>

      {purchases.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section className="dash-section">
            <h2 className="dash-section-title">Active plans</h2>
            <div className="plans-grid">
              {purchases.map(p => <PurchaseCard key={p.id} purchase={p} />)}
            </div>
          </section>

          <section className="dash-section">
            <h2 className="dash-section-title">Quick actions</h2>
            <div className="quick-grid">
              <QuickAction icon={<MessageCircle size={18}/>} label="Message Arpan" desc="Doubts, reschedule, anything" href={`https://wa.me/${WHATSAPP}`} color="green" />
              <QuickAction icon={<Video size={18}/>} label="Join Zoom" desc="Link shared before each session" href="https://zoom.us" color="blue" />
              <QuickAction icon={<Bell size={18}/>} label="View schedule" desc="Check your upcoming sessions" color="violet" onClick={() => {}} />
            </div>
          </section>
        </>
      )}
    </motion.div>
  );
}

// ── Sessions tab ───────────────────────────────────────────
function SessionsTab({ purchases }) {
  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">My Sessions</h1>
        <p className="dash-subtext">All your bookings and payment history.</p>
      </div>

      {purchases.length === 0 ? <EmptyState /> : (
        <div className="purchase-table-wrap">
          <table className="purchase-table">
            <thead>
              <tr>
                <th>Plan</th>
                <th>Amount</th>
                <th>Schedule</th>
                <th>Zoom</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td className="td-plan">{p.plan_name}</td>
                  <td className="td-amount">₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td className="td-schedule">
                    {p.scheduled_date && p.scheduled_slot
                      ? `${new Date(p.scheduled_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · ${SLOT_LABELS[p.scheduled_slot]||p.scheduled_slot}`
                      : p.weekly_day !== null && p.weekly_day !== undefined && p.weekly_slot
                        ? `Every ${DAYS[p.weekly_day]} · ${SLOT_LABELS[p.weekly_slot]||p.weekly_slot}`
                        : <span className="td-muted">Admin scheduled</span>
                    }
                  </td>
                  <td>
                    {p.zoom_join_url
                      ? <a href={p.zoom_join_url} target="_blank" rel="noopener noreferrer" className="zoom-link-btn">
                          Join Zoom
                        </a>
                      : <span className="td-muted">—</span>
                    }
                  </td>
                  <td>
                    <span className="status-badge"><CheckCircle size={11}/>{p.status}</span>
                  </td>
                  <td className="td-date">
                    {new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ── Admin: Group Sessions ──────────────────────────────────
function AdminGroupSessions() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ plan_key:'group_session', session_date:'', session_slot:'18:00', zoom_link:'', notes:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('group_sessions').select('*').order('session_date',{ascending:true}).then(({data}) => setSessions(data||[]));
  }, []);

  async function add() {
    if (!form.session_date || !form.session_slot) return;
    setSaving(true);
    const {data} = await supabase.from('group_sessions').insert(form).select().single();
    if (data) setSessions(s => [...s, data]);
    setForm(f => ({...f, session_date:'', zoom_link:'', notes:''}));
    setSaving(false);
  }

  async function remove(id) {
    await supabase.from('group_sessions').delete().eq('id', id);
    setSessions(s => s.filter(x => x.id !== id));
  }

  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">Group Sessions</h1>
        <p className="dash-subtext">Schedule sessions for group plans. Students see these after payment.</p>
      </div>

      <div className="admin-card">
        <div className="admin-form-title">Add new group session</div>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Plan</label>
            <select value={form.plan_key} onChange={e => setForm(f=>({...f,plan_key:e.target.value}))}>
              <option value="group_session">Group Session (single)</option>
              <option value="group_monthly">Group Monthly (recurring)</option>
            </select>
          </div>
          <div className="admin-field">
            <label>Date</label>
            <input type="date" value={form.session_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f=>({...f,session_date:e.target.value}))} />
          </div>
          <div className="admin-field">
            <label>Time slot</label>
            <select value={form.session_slot} onChange={e => setForm(f=>({...f,session_slot:e.target.value}))}>
              {Object.entries(SLOT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Zoom link</label>
            <input type="url" placeholder="https://zoom.us/j/..." value={form.zoom_link} onChange={e => setForm(f=>({...f,zoom_link:e.target.value}))} />
          </div>
        </div>
        <button className="btn-admin-add" onClick={add} disabled={saving}>
          <Plus size={15}/> {saving ? 'Saving…' : 'Add session'}
        </button>
      </div>

      <div className="admin-list">
        {sessions.length === 0 && <div className="admin-empty">No sessions scheduled yet.</div>}
        {sessions.map(s => (
          <div key={s.id} className="admin-list-row">
            <div className="alr-badge">{s.plan_key === 'group_monthly' ? 'Monthly' : 'Single'}</div>
            <div className="alr-main">
              <div className="alr-title">{new Date(s.session_date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
              <div className="alr-sub">{SLOT_LABELS[s.session_slot] || s.session_slot} {s.zoom_link && `· ${s.zoom_link}`}</div>
            </div>
            <button className="btn-alr-delete" onClick={() => remove(s.id)}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Admin: Block Slots ─────────────────────────────────────
function AdminBlockedSlots() {
  const [blocked, setBlocked] = useState([]);
  const [form, setForm] = useState({ blocked_date:'', slot:'', reason:'' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('blocked_slots').select('*').order('blocked_date',{ascending:true}).then(({data}) => setBlocked(data||[]));
  }, []);

  async function add() {
    if (!form.blocked_date) return;
    setSaving(true);
    const {data} = await supabase.from('blocked_slots').insert({
      blocked_date: form.blocked_date,
      slot: form.slot || null,
      reason: form.reason || null,
    }).select().single();
    if (data) setBlocked(b => [...b, data]);
    setForm({ blocked_date:'', slot:'', reason:'' });
    setSaving(false);
  }

  async function remove(id) {
    await supabase.from('blocked_slots').delete().eq('id', id);
    setBlocked(b => b.filter(x => x.id !== id));
  }

  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">Block Slots</h1>
        <p className="dash-subtext">Block dates or specific time slots from being booked by students.</p>
      </div>

      <div className="admin-card">
        <div className="admin-form-title">Block a date / slot</div>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Date</label>
            <input type="date" value={form.blocked_date} min={new Date().toISOString().split('T')[0]} onChange={e => setForm(f=>({...f,blocked_date:e.target.value}))} />
          </div>
          <div className="admin-field">
            <label>Slot (leave empty = whole day)</label>
            <select value={form.slot} onChange={e => setForm(f=>({...f,slot:e.target.value}))}>
              <option value="">— Entire day —</option>
              {Object.entries(SLOT_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label>Reason (optional)</label>
            <input type="text" placeholder="e.g. Personal leave" value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))} />
          </div>
        </div>
        <button className="btn-admin-add" onClick={add} disabled={saving}>
          <Plus size={15}/> {saving ? 'Saving…' : 'Block slot'}
        </button>
      </div>

      <div className="admin-list">
        {blocked.length === 0 && <div className="admin-empty">No slots blocked.</div>}
        {blocked.map(b => (
          <div key={b.id} className="admin-list-row">
            <div className="alr-badge red-badge">{b.slot ? 'Slot' : 'Full day'}</div>
            <div className="alr-main">
              <div className="alr-title">{new Date(b.blocked_date).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
              <div className="alr-sub">{b.slot ? SLOT_LABELS[b.slot] : 'Entire day blocked'}{b.reason ? ` · ${b.reason}` : ''}</div>
            </div>
            <button className="btn-alr-delete" onClick={() => remove(b.id)}><Trash2 size={14}/></button>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Admin: Topper Applications ─────────────────────────────
function AdminTopperApps() {
  const [apps, setApps] = useState([]);

  useEffect(() => {
    supabase.from('topper_applications').select('*').order('created_at',{ascending:false}).then(({data}) => setApps(data||[]));
  }, []);

  async function updateStatus(id, status) {
    await supabase.from('topper_applications').update({status}).eq('id', id);
    setApps(a => a.map(x => x.id === id ? {...x, status} : x));
  }

  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">Topper Applications</h1>
        <p className="dash-subtext">Review and approve 80% off yearly plan applicants.</p>
      </div>

      <div className="admin-list">
        {apps.length === 0 && <div className="admin-empty">No applications yet.</div>}
        {apps.map(a => (
          <div key={a.id} className="admin-list-row topper-row">
            <div className={`alr-badge status-${a.status}`}>{a.status}</div>
            <div className="alr-main">
              <div className="alr-title">{a.user_name || a.user_email}</div>
              <div className="alr-sub">WhatsApp: {a.whatsapp} · {new Date(a.created_at).toLocaleDateString('en-IN')}</div>
              {a.message && <div className="alr-msg">"{a.message}"</div>}
            </div>
            {a.status === 'pending' && (
              <div className="alr-actions">
                <button className="btn-approve" onClick={() => updateStatus(a.id, 'approved')}><Check size={14}/> Approve</button>
                <button className="btn-reject" onClick={() => updateStatus(a.id, 'rejected')}><X size={14}/> Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Admin: All Purchases ───────────────────────────────────
function AdminAllPurchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('purchases').select('*').order('created_at',{ascending:false}).limit(100).then(({data}) => {
      setPurchases(data||[]);
      setLoading(false);
    });
  }, []);

  return (
    <motion.div className="tab-content" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">All Purchases</h1>
        <p className="dash-subtext">Every payment across all students.</p>
      </div>
      {loading ? <div className="dash-loading"><div className="spinner"/></div> : (
        <div className="purchase-table-wrap">
          <table className="purchase-table">
            <thead><tr><th>Plan</th><th>Amount</th><th>User</th><th>Schedule</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {purchases.map(p => (
                <tr key={p.id}>
                  <td className="td-plan">{p.plan_name}</td>
                  <td className="td-amount">₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td className="td-muted" style={{fontSize:'0.75rem'}}>{p.user_id?.slice(0,8)}…</td>
                  <td className="td-schedule">
                    {p.scheduled_date ? `${new Date(p.scheduled_date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})} · ${SLOT_LABELS[p.scheduled_slot]||''}` :
                     p.weekly_day !== null && p.weekly_day !== undefined ? `Every ${DAYS[p.weekly_day]} · ${SLOT_LABELS[p.weekly_slot]||''}` :
                     <span className="td-muted">Admin set</span>}
                  </td>
                  <td><span className="status-badge"><CheckCircle size={11}/>{p.status}</span></td>
                  <td className="td-date">{new Date(p.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

// ── Helper components ──────────────────────────────────────
function PurchaseCard({ purchase: p }) {
  const isWeekly = p.weekly_day !== null && p.weekly_day !== undefined;
  const isDate = !!p.scheduled_date;
  const isAdmin = !isWeekly && !isDate;

  return (
    <div className="purchase-card">
      <div className="pc-header">
        <div className="pc-plan">{p.plan_name}</div>
        <span className="status-badge"><CheckCircle size={11}/> active</span>
      </div>
      <div className="pc-detail">
        {isDate && <><Calendar size={13}/> {new Date(p.scheduled_date).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short'})} · {SLOT_LABELS[p.scheduled_slot]||p.scheduled_slot}</>}
        {isWeekly && <><Calendar size={13}/> Every {DAYS[p.weekly_day]} · {SLOT_LABELS[p.weekly_slot]||p.weekly_slot}</>}
        {isAdmin && <><Clock size={13}/> Arpan schedules — check WhatsApp</>}
      </div>
      <div className="pc-amount">₹{p.amount?.toLocaleString('en-IN')} <span className="pc-period">· {p.billing_period}</span></div>
      <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" className="pc-wa">
        <MessageCircle size={13}/> Contact Arpan
      </a>
    </div>
  );
}

function QuickAction({ icon, label, desc, href, color, onClick }) {
  const inner = (
    <div className={`quick-action color-${color}`}>
      <div className="qa-icon">{icon}</div>
      <div><div className="qa-label">{label}</div><div className="qa-desc">{desc}</div></div>
      {href && <ArrowRight size={15} className="qa-arrow"/>}
    </div>
  );
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer">{inner}</a>
    : <button onClick={onClick} style={{background:'none',width:'100%',textAlign:'left'}}>{inner}</button>;
}

function EmptyState() {
  return (
    <motion.div className="dash-empty" initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
      <div className="empty-icon"><Package size={28}/></div>
      <h3>No sessions yet</h3>
      <p>You haven't booked any sessions. Grab a spot before they fill up!</p>
      <Link to="/#pricing" className="empty-cta">View plans <ArrowRight size={14}/></Link>
    </motion.div>
  );
}

// ── Admin: Promo Codes ─────────────────────────────────────
function AdminPromos({ userId }) {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: '', discount_pct: '', max_uses_total: '100',
    max_uses_per_user: '1', expires_at: '',
  });
  const [error, setError] = useState('');

  async function fetchCodes() {
    const res = await fetch('/api/admin-promo', {
      headers: { 'x-user-id': userId },
    });
    const data = await res.json();
    setCodes(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { fetchCodes(); }, []);

  async function create() {
    if (!form.code || !form.discount_pct) { setError('Code and discount % are required.'); return; }
    if (parseInt(form.discount_pct) < 1 || parseInt(form.discount_pct) > 100) { setError('Discount must be 1–100%.'); return; }
    setSaving(true); setError('');
    const res = await fetch('/api/admin-promo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error); return; }
    setCodes(c => [data, ...c]);
    setForm({ code:'', discount_pct:'', max_uses_total:'100', max_uses_per_user:'1', expires_at:'' });
  }

  async function toggleActive(id, active) {
    const res = await fetch('/api/admin-promo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ id, active }),
    });
    const data = await res.json();
    if (res.ok) setCodes(c => c.map(x => x.id === id ? data : x));
  }

  async function deleteCode(id) {
    if (!confirm('Delete this promo code?')) return;
    await fetch('/api/admin-promo', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ id }),
    });
    setCodes(c => c.filter(x => x.id !== id));
  }

  return (
    <motion.div className="tab-content" initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
      <div className="dash-topbar">
        <h1 className="dash-greeting">Promo Codes</h1>
        <p className="dash-subtext">Create discount codes. Control total uses and per-user uses. Up to 100% off.</p>
      </div>

      {/* Create form */}
      <div className="admin-card">
        <div className="admin-form-title">Create new promo code</div>
        <div className="admin-form-row">
          <div className="admin-field">
            <label>Code</label>
            <input
              type="text"
              placeholder="e.g. NEET50"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
            />
          </div>
          <div className="admin-field">
            <label>Discount %</label>
            <input
              type="number" min="1" max="100"
              placeholder="e.g. 50"
              value={form.discount_pct}
              onChange={e => setForm(f => ({ ...f, discount_pct: e.target.value }))}
            />
          </div>
          <div className="admin-field">
            <label>Max total uses</label>
            <input
              type="number" min="1"
              placeholder="100"
              value={form.max_uses_total}
              onChange={e => setForm(f => ({ ...f, max_uses_total: e.target.value }))}
            />
          </div>
          <div className="admin-field">
            <label>Max uses per user</label>
            <input
              type="number" min="1"
              placeholder="1"
              value={form.max_uses_per_user}
              onChange={e => setForm(f => ({ ...f, max_uses_per_user: e.target.value }))}
            />
          </div>
          <div className="admin-field">
            <label>Expires at (optional)</label>
            <input
              type="date"
              value={form.expires_at}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
            />
          </div>
        </div>
        {error && <div className="promo-admin-error">{error}</div>}
        <button className="btn-admin-add" onClick={create} disabled={saving}>
          <Plus size={15}/> {saving ? 'Creating…' : 'Create code'}
        </button>
      </div>

      {/* Codes list */}
      {loading ? <div className="dash-loading"><div className="spinner"/></div> : (
        <div className="promo-table-wrap">
          {codes.length === 0 && <div className="admin-empty">No promo codes yet.</div>}
          {codes.length > 0 && (
            <table className="purchase-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Uses</th>
                  <th>Per user</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(c => (
                  <tr key={c.id}>
                    <td className="td-plan promo-code-cell">{c.code}</td>
                    <td className="td-amount">{c.discount_pct}%</td>
                    <td>
                      <span className={c.uses_so_far >= c.max_uses_total ? 'promo-exhausted' : ''}>
                        {c.uses_so_far} / {c.max_uses_total}
                      </span>
                    </td>
                    <td>{c.max_uses_per_user}x</td>
                    <td className="td-date">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                    </td>
                    <td>
                      <span className={`promo-status-badge ${c.active ? 'active' : 'inactive'}`}>
                        {c.active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td>
                      <div className="promo-actions">
                        <button
                          className={`btn-promo-toggle ${c.active ? 'pause' : 'resume'}`}
                          onClick={() => toggleActive(c.id, !c.active)}
                        >
                          {c.active ? 'Pause' : 'Resume'}
                        </button>
                        <button className="btn-alr-delete" onClick={() => deleteCode(c.id)}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </motion.div>
  );
}
