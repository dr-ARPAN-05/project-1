import { Calendar } from 'lucide-react';

export default function SessionInstanceRow({ instance }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet/15 text-lavender">
          <Calendar size={14} />
        </div>
        <div>
          <div className="text-sm text-white">{instance.label}</div>
          <div className="text-xs text-white/40">
            {instance.date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} ·{' '}
            {instance.slotLabel}
          </div>
        </div>
      </div>
      {instance.zoomJoinUrl && (
        <a
          href={instance.zoomJoinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line px-3 py-1.5 text-xs text-white/70 transition hover:border-violet/50 hover:text-white"
        >
          Join Zoom
        </a>
      )}
    </div>
  );
}
