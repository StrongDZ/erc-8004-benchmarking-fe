'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMemo, useState } from 'react';
import { format, startOfWeek } from 'date-fns';
import type { ReputationScorePoint } from '@/shared/api/client';

type View = 'day' | 'month' | 'year';

interface Props { points: ReputationScorePoint[]; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  const isDecay = d.payload.type === 'decay';
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="text-muted mb-1">{label}</div>
      <div
        className="font-medium"
        style={{ color: isDecay ? 'var(--color-primary)' : 'var(--color-accent)' }}
      >
        {isDecay ? '⬇ Decay' : '⬆ Event'}: <strong>{Number(d.value).toFixed(2)}</strong>
      </div>
    </div>
  );
};

// bucketDecays preserves every "event" point and collapses "decay" points into one per
// bucket (last decay per bucket). Buckets:
//   day   — no bucketing
//   month — ISO week (Mon)
//   year  — calendar month (UTC)
function bucketDecays(points: ReputationScorePoint[], view: View): ReputationScorePoint[] {
  if (view === 'day') return points;
  const bucketKey = (iso: string) => {
    const d = new Date(iso);
    if (view === 'month') {
      const monday = startOfWeek(d, { weekStartsOn: 1 });
      return `w-${monday.toISOString().slice(0, 10)}`;
    }
    return `m-${d.getUTCFullYear()}-${d.getUTCMonth()}`;
  };
  const lastDecayByBucket = new Map<string, ReputationScorePoint>();
  const events: ReputationScorePoint[] = [];
  for (const p of points) {
    if (p.type === 'event') {
      events.push(p);
      continue;
    }
    lastDecayByBucket.set(bucketKey(p.timestamp), p);
  }
  const merged = [...events, ...Array.from(lastDecayByBucket.values())];
  merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return merged;
}

function formatLabel(iso: string, view: View): string {
  const d = new Date(iso);
  if (view === 'year') return format(d, 'MMM yyyy');
  return format(d, 'MMM d');
}

export default function ReputationScoreChart({ points }: Props) {
  const [view, setView] = useState<View>('day');

  const data = useMemo(() => {
    const bucketed = bucketDecays(points, view);
    return bucketed.map(p => ({
      ...p,
      date: formatLabel(p.timestamp, view),
      displayScore: Number(p.score.toFixed(2)),
    }));
  }, [points, view]);

  const domain = useMemo<[number, number] | undefined>(() => {
    if (!data.length) return undefined;
    const raw = data.map(d => d.displayScore);
    const min = Math.min(...raw);
    const max = Math.max(...raw);
    const range = max - min || 1;
    const pad = range * 0.1;
    return [Math.floor(min - pad), Math.ceil(max + pad)];
  }, [data]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-white">Reputation Score History</h3>
        <div className="tabs">
          {(['day', 'month', 'year'] as View[]).map(v => (
            <button
              key={v}
              className={`tab-btn ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {!data.length ? (
        <div className="py-16 text-center text-muted text-sm">No reputation history available</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="date" tick={{ fill: 'var(--color-text-subtle)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              domain={domain}
              allowDecimals={false}
              tickFormatter={(v) => Number(v).toFixed(0)}
              tick={{ fill: 'var(--color-text-subtle)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="displayScore"
              stroke="var(--color-accent)"
              strokeWidth={2.5}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(p: any) => {
                const isDecay = p.payload.type === 'decay';
                return <circle key={p.key} cx={p.cx} cy={p.cy} r={isDecay ? 3 : 4} fill={isDecay ? 'var(--color-primary)' : 'var(--color-accent)'} stroke="none" />;
              }}
              activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--color-bg-card)', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-4 mt-3 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent" />
          Event
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-primary" />
          Decay
        </div>
      </div>
    </div>
  );
}
