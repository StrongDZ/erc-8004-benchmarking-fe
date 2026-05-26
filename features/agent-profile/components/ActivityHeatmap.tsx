'use client';
import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { format, subYears } from 'date-fns';
import type { HeatmapDay } from '@/shared/api/client';
import { EC } from '@/features/agent-profile/lib/echarts-theme';

interface Props { data: HeatmapDay[]; }

const HEAT_COLORS = [
  '#1c1c1f',
  'rgba(245,158,11,0.25)',
  'rgba(245,158,11,0.5)',
  'rgba(245,158,11,0.75)',
  '#F59E0B',
] as const;

function legendColor(pct: number): string {
  if (pct === 0) return HEAT_COLORS[0];
  if (pct <= 0.25) return HEAT_COLORS[1];
  if (pct <= 0.5)  return HEAT_COLORS[2];
  if (pct <= 0.75) return HEAT_COLORS[3];
  return HEAT_COLORS[4];
}

export default function ActivityHeatmap({ data }: Props) {
  const { option, maxCount } = useMemo(() => {
    const today = new Date();
    const yearAgo = subYears(today, 1);
    const max = Math.max(0, ...data.map(d => d.count));

    const byDate: Record<string, HeatmapDay> = {};
    data.forEach(d => { byDate[d.date] = d; });

    const opt = {
      backgroundColor: 'transparent',
      calendar: {
        range: [format(yearAgo, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd')],
        cellSize: [14, 14],
        left: 28,
        top: 20,
        right: 10,
        bottom: 10,
        itemStyle: { borderWidth: 2, borderColor: '#0F172A', borderRadius: 3 },
        splitLine: { show: false },
        dayLabel: {
          nameMap: ['', 'Mon', '', 'Wed', '', 'Fri', ''],
          color: EC.axis,
          fontSize: 10,
          firstDay: 1,
        },
        monthLabel: { color: EC.axis, fontSize: 10 },
        yearLabel: { show: false },
      },
      visualMap: {
        show: false,
        min: 0,
        max: Math.max(1, max),
        inRange: { color: [...HEAT_COLORS] },
      },
      tooltip: {
        backgroundColor: EC.tooltipBg,
        borderColor: EC.tooltipBorder,
        borderWidth: 1,
        textStyle: { color: '#E2E8F0', fontSize: 11 },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        formatter: (params: any) => {
          const dateStr = params.value[0] as string;
          const count = params.value[1] as number;
          const day = byDate[dateStr];
          if (!count) {
            return `<div style="color:${EC.axis}">${dateStr}</div><div>No activity</div>`;
          }
          return [
            `<div style="color:#94A3B8;margin-bottom:4px">${dateStr}</div>`,
            `<div>Tasks: <strong style="color:#F59E0B">${count}</strong></div>`,
            day ? `<div style="color:${EC.axis}">✓ ${day.passed} &nbsp; ✗ ${day.failed}</div>` : '',
          ].join('');
        },
      },
      series: [{
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: data.map(d => [d.date, d.count]),
        itemStyle: { borderWidth: 0 },
      }],
    };

    return { option: opt, maxCount: max };
  }, [data]);

  return (
    <div className="card p-5">
      <h3 className="font-heading text-lg text-white">Activity Heatmap</h3>
      <p className="text-sm text-muted mb-3">Task activity over the past year</p>

      <div className="overflow-x-auto pb-1">
        <ReactECharts option={option} style={{ height: 160, minWidth: 720 }} />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted mt-2">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <div
            key={pct}
            className="w-[14px] h-[14px] rounded-[3px]"
            style={{ background: legendColor(pct) }}
          />
        ))}
        <span>More</span>
        <span className="ml-auto">max {maxCount}/day</span>
      </div>
    </div>
  );
}
