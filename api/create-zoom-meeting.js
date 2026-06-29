// Zoom Server-to-Server OAuth — create meeting as admin/host
// Called after payment is verified

const ZOOM_API = 'https://api.zoom.us/v2';

async function getZoomToken() {
  const credentials = Buffer.from(
    `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Zoom token error: ${err}`);
  }

  const data = await res.json();
  return data.access_token;
}

// Build the UTC start time from date + slot (IST = UTC+5:30)
function buildStartTime(scheduledDate, slotKey) {
  // slotKey is like "18:00", "18:30", "19:45", "19:00"
  const [hours, minutes] = slotKey.split(':').map(Number);

  // Parse date as IST midnight, then add slot hours
  const [year, month, day] = scheduledDate.split('-').map(Number);

  // IST offset = +5:30 = 330 minutes ahead of UTC
  // So IST 18:00 = UTC 12:30
  const istOffsetMinutes = 330;
  const slotMinutesFromMidnight = hours * 60 + minutes;
  const utcMinutes = slotMinutesFromMidnight - istOffsetMinutes;

  // Build from UTC midnight of the date
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCMinutes(base.getUTCMinutes() + utcMinutes);

  return base.toISOString(); // e.g. "2025-01-15T12:30:00Z"
}

// For weekly plans (no specific date) — build next occurrence of the given weekday
function nextDateForWeekday(weeklyDay) {
  const now = new Date();
  const today = now.getDay(); // 0=Sun
  let daysAhead = weeklyDay - today;
  if (daysAhead <= 0) daysAhead += 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysAhead);
  return next.toISOString().split('T')[0]; // YYYY-MM-DD
}

// Plan → duration map (minutes)
const PLAN_DURATION = {
  personal_session:  30,
  personal_monthly:  30,
  personal_yearly:   30,
  ghost_deal:        30,
  group_session:     40,
  group_monthly:     40,
};

// Plan → topic map
function getMeetingTopic(planKey, planName, userName) {
  const isGroup = planKey.includes('group');
  if (isGroup) return `ArpanMentors — Group Session`;
  return `ArpanMentors — 1-on-1 with ${userName || 'Student'}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    planKey,
    planName,
    userName,
    scheduledDate,   // for personal_session: "2025-01-15"
    scheduledSlot,   // for personal_session: "19:45"
    weeklyDay,       // for monthly/yearly: 1–6
    weeklySlot,      // for monthly/yearly: "18:00"
  } = req.body;

  if (!planKey) {
    return res.status(400).json({ error: 'Missing planKey' });
  }

  try {
    const token = await getZoomToken();

    // Determine start time
    let startTime;
    let slotUsed;

    if (scheduledDate && scheduledSlot) {
      // One-time personal session: specific date + slot
      startTime = buildStartTime(scheduledDate, scheduledSlot);
      slotUsed = scheduledSlot;
    } else if (weeklyDay !== undefined && weeklySlot) {
      // Monthly/yearly: use next occurrence of the weekday
      const nextDate = nextDateForWeekday(weeklyDay);
      startTime = buildStartTime(nextDate, weeklySlot);
      slotUsed = weeklySlot;
    } else {
      // Group session / admin-sets: schedule for tomorrow at 19:00 IST as placeholder
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      startTime = buildStartTime(tomorrowStr, '19:00');
      slotUsed = '19:00';
    }

    const duration = PLAN_DURATION[planKey] || 30;
    const topic = getMeetingTopic(planKey, planName, userName);

    const meetingPayload = {
      topic,
      type: 2, // scheduled meeting
      start_time: startTime,
      duration,
      timezone: 'Asia/Kolkata',
      agenda: `ArpanMentors session — ${planName}`,
      settings: {
        join_before_host: true,   // student can join without waiting
        waiting_room: false,       // no waiting room friction
        host_video: true,
        participant_video: true,
        auto_recording: 'none',
        mute_upon_entry: false,
      },
    };

    const zoomRes = await fetch(`${ZOOM_API}/users/me/meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(meetingPayload),
    });

    if (!zoomRes.ok) {
      const err = await zoomRes.json();
      console.error('Zoom create meeting error:', err);
      return res.status(500).json({ error: 'Failed to create Zoom meeting', detail: err });
    }

    const meeting = await zoomRes.json();

    return res.status(200).json({
      meeting_id:    meeting.id,
      join_url:      meeting.join_url,
      start_url:     meeting.start_url,  // host link — keep server-side only
      password:      meeting.password,
      start_time:    meeting.start_time,
      duration:      meeting.duration,
      topic:         meeting.topic,
    });
  } catch (err) {
    console.error('Zoom API error:', err);
    return res.status(500).json({ error: err.message });
  }
}
