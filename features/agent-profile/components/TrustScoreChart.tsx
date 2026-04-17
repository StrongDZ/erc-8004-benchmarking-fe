'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { format } from 'date-fns';

interface Point { timestamp: string; score: number; type: string; txHash?: string; }
interface Props { points: Point[]; }

const RESOLUTIONS = ['raw', '1h', '6h', '1d'] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-[#1E293B] border border-border rounded-md px-3 py-2 text-xs shadow-lg">
      <div className="text-muted mb-1">{label}</div>
      <div
        className="font-medium"
        style={{ color: d.payload.type === 'decay' ? '#F59E0B' : '#8B5CF6' }}
      >
        {d.payload.type === 'decay' ? '⬇ Decay' : '⬆ Event'}: <strong>{Number(d.value).toFixed(2)}</strong>
      </div>
    </div>
  );
};

export default function TrustScoreChart({ points }: Props) {
  const [res, setRes] = useState('1d');

  const formatted = points.map(p => ({
    ...p,
    date: format(new Date(p.timestamp), 'MMM d'),
    displayScore: Number(p.score.toFixed(2)),
  }));

  const min = formatted.length ? Math.max(0, Math.min(...formatted.map(p => p.displayScore)) - 20) : 0;
  const max = formatted.length ? Math.min(1000, Math.max(...formatted.map(p => p.displayScore)) + 20) : 1000;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-white">TrustScore Evolution</h3>
        <div className="tabs">
          {RESOLUTIONS.map(r => (
            <button
              key={r}
              className={`tab-btn ${res === r ? 'active' : ''}`}
              onClick={() => setRes(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!points.length && (
        <div className="py-16 text-center text-muted text-sm">No score history available</div>
      )}

      {points.length > 0 && (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={formatted} margin={{ top: 10, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45,63,85,0.6)" />
            <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis domain={[min, max]} tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} axisLine={false} width={45} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="displayScore"
              stroke="#8B5CF6"
              strokeWidth={2.5}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(p: any) => {
                const isDecay = p.payload.type === 'decay';
                return <circle key={p.key} cx={p.cx} cy={p.cy} r={isDecay ? 3 : 4} fill={isDecay ? '#F59E0B' : '#8B5CF6'} stroke="none" />;
              }}
              activeDot={{ r: 6, fill: '#A78BFA', stroke: '#8B5CF6', strokeWidth: 2 }}
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
