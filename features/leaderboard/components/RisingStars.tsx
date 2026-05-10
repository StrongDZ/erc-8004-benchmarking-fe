'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Rocket, Zap } from 'lucide-react';
import { api, RisingStar } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props { chainIds: number[]; }

const PERIODS = ['24h', '7d', '30d'] as const;

export default function RisingStars({ chainIds }: Props) {
  const [data, setData] = useState<RisingStar[]>([]);
  const [period, setPeriod] = useState<string>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (chainIds.length === 0) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.risingStarsMulti(chainIds, period, 10).then(r => {
      if (r.success) setData(r.data ?? []);
      setLoading(false);
    });
  }, [chainIds, period]);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-white text-base">
          <Rocket size={18} color="var(--color-primary)" />
          <span>Rising Stars</span>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-md border border-border">
          {PERIODS.map(p => (
            <button
              key={p}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                period === p
                  ? 'bg-primary text-black font-semibold'
                  : 'text-muted hover:text-white'
              }`}
              onClick={() => setPeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-2 min-h-[220px]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-1 min-h-[220px]">
          {data.map((star, idx) => (
            <Link
              key={star.agentId}
              href={`/agents/${star.chainId}/${star.agentId}`}
              className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/5 transition-colors"
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                  idx === 0
                    ? 'bg-primary text-black'
                    : idx === 1
                    ? 'bg-zinc-300 text-black'
                    : idx === 2
                    ? 'bg-orange-400 text-black'
                    : 'bg-white/10 text-muted'
                }`}
              >
                {idx + 1}
              </span>
              <div className="flex-1 flex flex-col min-w-0">
                <span className="text-sm text-white font-medium truncate">{star.name}</span>
                <span className="text-xs text-muted">Score {star.scoreNow.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-success font-semibold">
                <TrendingUp size={13} color="var(--color-success)" />
                <span>+{star.delta.toFixed(1)}</span>
              </div>
              {idx === 0 && (
                <Badge variant="success" className="ml-1 text-[10px] py-0 px-1.5">
                  <Zap size={9} /> Top
                </Badge>
              )}
            </Link>
          ))}
          {!data.length && (
            <p className="text-sm text-muted text-center py-6">No data available</p>
          )}
        </div>
      )}
    </div>
  );
}
