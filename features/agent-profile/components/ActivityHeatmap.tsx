'use client';
import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, subYears, startOfWeek, addDays } from 'date-fns';
import { HeatmapDay } from '@/shared/api/client';

interface Props { data: HeatmapDay[]; }

function getColor(count: number, max: number): string {
  if (!count || max === 0) return '#1c1c1f';
  const pct = count / max;
  if (pct < 0.25) return 'rgba(245,158,11,0.25)';
  if (pct < 0.5)  return 'rgba(245,158,11,0.5)';
  if (pct < 0.75) return 'rgba(245,158,11,0.75)';
  return '#F59E0B';
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Mon','','Wed','','Fri','',''];

export default function ActivityHeatmap({ data }: Props) {
  const { weeks, maxCount } = useMemo(() => {
    const byDate: Record<string, HeatmapDay> = {};
    data.forEach(d => { byDate[d.date] = d; });

    const today = new Date();
    const yearAgo = subYears(today, 1);
    eachDayOfInterval({ start: yearAgo, end: today });
    const max = Math.max(0, ...data.map(d => d.count));

    const weekMap: Array<Array<{ date: string; info: HeatmapDay | null }>> = [];
    let week: typeof weekMap[0] = [];
    const startDay = startOfWeek(yearAgo, { weekStartsOn: 1 });
    let cur = startDay;

    while (cur <= today) {
      const key = format(cur, 'yyyy-MM-dd');
      week.push({ date: key, info: byDate[key] ?? null });
      if (week.length === 7) { weekMap.push(week); week = []; }
      cur = addDays(cur, 1);
    }
    if (week.length > 0) {
      while (week.length < 7) week.push({ date: '', info: null });
      weekMap.push(week);
    }

    return { weeks: weekMap, maxCount: max };
  }, [data]);

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIdx: number }[] = [];
    weeks.forEach((week, wi) => {
      const first = week.find(d => d.date);
      if (!first?.date) return;
      const d = parseISO(first.date);
      if (d.getDate() <= 7 || wi === 0) {
        labels.push({ label: MONTHS[d.getMonth()], weekIdx: wi });
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="card p-5">
      <h3 className="font-heading text-lg text-white">Activity Heatmap</h3>
      <p className="text-sm text-muted mb-4">Task activity over the past year</p>

      <div className="flex gap-2 overflow-x-auto pb-2">
        <div className="flex flex-col gap-[3px] pt-4 text-[10px] text-subtle shrink-0">
          {DAYS.map((d, i) => (
            <span key={i} className="h-[14px] leading-[14px]">{d}</span>
          ))}
        </div>

        <div className="flex flex-col">
          <div
            className="grid gap-[3px] text-[10px] text-subtle mb-1"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)` }}
          >
            {weeks.map((_, wi) => {
              const m = monthLabels.find(l => l.weekIdx === wi);
              return <span key={wi}>{m?.label ?? ''}</span>;
            })}
          </div>

          <div
            className="grid grid-flow-col gap-[3px]"
            style={{ gridTemplateColumns: `repeat(${weeks.length}, 14px)`, gridTemplateRows: 'repeat(7, 14px)' }}
          >
            {weeks.map((week, wi) =>
              week.map((day, di) => (
                <div
                  key={`${wi}-${di}`}
                  className="w-[14px] h-[14px] rounded-[3px]"
                  style={{ background: getColor(day.info?.count ?? 0, maxCount) }}
                  title={day.date ? `${day.date}: ${day.info?.count ?? 0} tasks (✓${day.info?.passed ?? 0} ✗${day.info?.failed ?? 0})` : ''}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted mt-4">
        <span>Less</span>
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <div
            key={pct}
            className="w-[14px] h-[14px] rounded-[3px]"
            style={{ background: getColor(pct * maxCount, maxCount) }}
          />
        ))}
        <span>More</span>
        <span className="ml-auto">max {maxCount}/day</span>
      </div>
    </div>
  );
}
