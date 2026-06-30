'use client';
import ReactECharts from 'echarts-for-react';
import type { RadarData } from '@/shared/api/client';
import { EC } from '@/features/agent-profile/lib/echarts-theme';

interface Props { data: RadarData | null; }

const AXES = [
  { key: 'successRate', label: 'Success Rate' },
  { key: 'taskVolume',  label: 'Task Volume' },
  { key: 'consistency', label: 'Consistency' },
] as const;

export default function AgentRadarChart({ data }: Props) {
  if (!data) {
    return (
      <div className="card p-5 flex items-center justify-center min-h-[260px] text-muted text-sm">
        No radar data available
      </div>
    );
  }

  const values = AXES.map(a => Math.round((data[a.key as keyof RadarData] ?? 0) * 100));

  const option = {
    backgroundColor: 'transparent',
    radar: {
      indicator: AXES.map(a => ({ name: a.label, max: 100 })),
      splitNumber: 4,
      center: ['50%', '50%'],
      radius: '65%',
      axisName: { color: '#94A3B8', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(45,63,85,0.7)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(45,63,85,0.7)' } },
    },
    tooltip: {
      backgroundColor: EC.tooltipBg,
      borderColor: EC.tooltipBorder,
      borderWidth: 1,
      textStyle: { color: '#E2E8F0', fontSize: 11 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      formatter: (params: any) => {
        const vals = params.value as number[];
        return AXES.map((a, i) => `${a.label}: <strong>${vals[i]}%</strong>`).join('<br/>');
      },
    },
    series: [{
      type: 'radar',
      data: [{
        value: values,
        name: 'Agent',
        label: {
          show: true,
          color: '#94A3B8',
          fontSize: 10,
          fontWeight: 600,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter: (p: any) => {
            const v = Array.isArray(p.value) ? p.value[p.dimensionIndex ?? 0] : p.value;
            return `${v}%`;
          },
        },
      }],
      lineStyle: { color: EC.accent, width: 2 },
      itemStyle: { color: EC.accent },
      areaStyle: {
        color: 'rgba(139,92,246,0.25)',
        shadowBlur: 10,
        shadowColor: 'rgba(139,92,246,0.4)',
      },
      symbol: 'circle',
      symbolSize: 5,
    }],
  };

  return (
    <div className="card p-5 h-full flex flex-col">
      <h3 className="font-heading text-lg text-white mb-3">Skill Radar</h3>
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <ReactECharts option={option} style={{ height: 240, width: '100%' }} />
      </div>
    </div>
  );
}
