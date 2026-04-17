'use client';
import { RadarChart as RChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';
import { RadarData } from '@/shared/api/client';

interface Props { data: RadarData | null; }

const AXES = [
  { key: 'successRate',   label: 'Success Rate' },
  { key: 'taskVolume',    label: 'Task Volume' },
  { key: 'avgDifficulty', label: 'Avg Difficulty' },
  { key: 'scoreVelocity', label: 'Velocity' },
  { key: 'domainDepth',   label: 'Domain Depth' },
  { key: 'consistency',   label: 'Consistency' },
];

export default function AgentRadarChart({ data }: Props) {
  if (!data) {
    return (
      <div className="card p-5 flex items-center justify-center min-h-[260px] text-muted text-sm">
        No radar data available
      </div>
    );
  }

  const chartData = AXES.map(a => ({
    axis: a.label,
    value: Math.round((data[a.key as keyof RadarData] ?? 0) * 100),
  }));

  return (
    <div className="card p-5">
      <h3 className="font-heading text-lg text-white mb-3">Skill Radar</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RChart data={chartData} margin={{ top: 10, right: 24, bottom: 10, left: 24 }}>
          <PolarGrid stroke="rgba(45,63,85,0.7)" />
          <PolarAngleAxis dataKey="axis" tick={{ fill: '#94A3B8', fontSize: 11 }} />
          <Tooltip
            formatter={(v: number) => [`${v}%`, 'Value']}
            contentStyle={{ background: '#1E293B', border: '1px solid #2D3F55', borderRadius: 10, fontFamily: 'Exo 2' }}
            labelStyle={{ color: '#F8FAFC' }}
          />
          <Radar
            dataKey="value"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 4, strokeWidth: 0 }}
          />
        </RChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5 mt-3">
        {AXES.map(a => (
          <div key={a.key} className="flex items-center gap-2 text-xs">
            <span className="w-32 text-muted">{a.label}</span>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${(data[a.key as keyof RadarData] ?? 0) * 100}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-muted">
              {((data[a.key as keyof RadarData] ?? 0) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
