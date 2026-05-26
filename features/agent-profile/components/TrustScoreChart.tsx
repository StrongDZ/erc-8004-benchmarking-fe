'use client';
import ReactECharts from 'echarts-for-react';
import { useMemo, useState } from 'react';
import type { TrustScorePoint } from '@/shared/api/client';
import { EC } from '@/features/agent-profile/lib/echarts-theme';

type View = 'day' | 'month' | 'year';
interface Props { points: TrustScorePoint[]; }

function filterPoints(points: TrustScorePoint[], view: View): TrustScorePoint[] {
  if (view === 'day') return points;
  if (view === 'month') return points.filter(p => new Date(p.timestamp).getUTCDay() === 1);
  return points.filter(p => new Date(p.timestamp).getUTCDate() === 1);
}

function niceYDomain(points: TrustScorePoint[]): [number, number] {
  if (!points.length) return [0, 100];
  const scores = points.map(p => p.score);
  const rawMin = Math.min(...scores);
  const rawMax = Math.max(...scores);
  const lo = Math.floor(rawMin / 10) * 10;
  const hi = Math.ceil(rawMax / 10) * 10;
  return lo === hi ? [Math.max(0, lo - 10), Math.min(100, hi + 10)] : [lo, hi];
}

function axisFormatter(view: View) {
  return (value: number) => {
    const d = new Date(value);
    if (view === 'year') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
}

export default function TrustScoreChart({ points }: Props) {
  const [view, setView] = useState<View>('day');

  const option = useMemo(() => {
    const filtered = filterPoints(points, view);
    const [yMin, yMax] = niceYDomain(filtered);
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const dataZoomBase = {
      fillerColor: 'rgba(139,92,246,0.15)',
      borderColor: 'transparent',
      handleStyle: { color: EC.accent },
      textStyle: { color: EC.axis },
      dataBackground: { lineStyle: { color: EC.accent, opacity: 0.3 }, areaStyle: { opacity: 0 } },
    };

    return {
      backgroundColor: 'transparent',
      animation: true,
      grid: { left: 50, right: 20, top: 10, bottom: 60, containLabel: false },
      xAxis: {
        type: 'time',
        axisLabel: { color: EC.axis, fontSize: 11, formatter: axisFormatter(view) },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
      },
      yAxis: {
        type: 'value',
        min: yMin,
        max: yMax,
        axisLabel: {
          color: EC.axis,
          fontSize: 11,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (v: any) => Number(v).toFixed(0),
        },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: EC.grid } },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: EC.tooltipBg,
        borderColor: EC.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          if (!p) return '';
          const point = filtered[p.dataIndex as number];
          const isDecay = point?.type === 'decay';
          const date = new Date(p.value[0] as number).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
          });
          const score = Number(p.value[1]).toFixed(2);
          const hashLine = point?.txHash
            ? `<div style="color:${EC.axis};font-size:10px;margin-top:2px">${point.txHash.slice(0, 14)}…</div>`
            : '';
          return `<div style="color:#94A3B8;margin-bottom:4px">${date}</div>
            <div style="color:${isDecay ? EC.primary : EC.accent};font-weight:700">
              ${isDecay ? '⬇ Decay' : '⬆ Event'}: ${score}
            </div>${hashLine}`;
        },
      },
      dataZoom: [
        {
          type: 'slider',
          bottom: 8,
          height: 20,
          ...(view === 'day'
            ? { startValue: thirtyDaysAgo, endValue: now }
            : { start: 0, end: 100 }),
          ...dataZoomBase,
        },
        { type: 'inside' },
      ],
      series: [{
        type: 'line',
        data: filtered.map(p => ({
          value: [new Date(p.timestamp).getTime(), p.score],
          itemStyle: { color: p.type === 'event' ? EC.accent : EC.primary },
          symbolSize: p.type === 'event' ? 8 : 6,
        })),
        lineStyle: { color: EC.accent, width: 2.5 },
        symbol: 'circle',
        smooth: false,
        emphasis: { scale: 1.5 },
      }],
    };
  }, [points, view]);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading text-lg text-white">Trust Score History</h3>
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

      {!points.length ? (
        <div className="py-16 text-center text-muted text-sm">No trust score history available</div>
      ) : (
        <ReactECharts option={option} style={{ height: 300 }} />
      )}

      <div className="flex items-center gap-4 mt-1 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: EC.accent }} />
          Event
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: EC.primary }} />
          Decay
        </div>
      </div>
    </div>
  );
}
