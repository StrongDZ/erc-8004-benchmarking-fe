'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'accent' | 'success' | 'danger';
}

function useCountUp(target: number | null, duration = 1200) {
  const [val, setVal] = useState(0);
  const startRef = useRef<number>();
  useEffect(() => {
    if (target === null || Number.isNaN(target)) return;
    let frame: number;
    const start = performance.now();
    startRef.current = start;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round((target as number) * ease));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return val;
}

export default function KpiCard({ label, value, sub, icon, color = 'primary' }: Props) {
  const isNum = typeof value === 'number';
  const counted = useCountUp(isNum ? (value as number) : null);
  const display = isNum ? counted : value;

  return (
    <div className={`card overflow-hidden flex items-center pr-4 pl-5 py-5 gap-4 hover:border-border/80 transition-colors`}>
      <div className={`flex items-center justify-center min-w-[48px] w-12 h-12 rounded-xl border bg-black/40 ${color === 'primary' ? 'text-primary border-primary/20' : color === 'success' ? 'text-success border-success/20' : color === 'accent' ? 'text-accent border-accent/20' : 'text-danger border-danger/20'}`}>
        {icon}
      </div>
      <div className="flex flex-col min-w-0 pr-2">
        <span className="text-3xl font-bold font-heading text-white tracking-tight leading-none mb-1">
          {typeof display === 'number' ? display.toLocaleString() : display}
        </span>
        <span className="text-sm font-medium text-muted uppercase tracking-wide truncate">
          {label}
        </span>
        {sub && (
          <span className="text-xs text-subtle mt-1 truncate">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
