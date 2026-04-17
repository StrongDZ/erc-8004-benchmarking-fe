'use client';
import { CheckCircle, XCircle } from 'lucide-react';
import { LeaderboardAgent, resolveIPFS } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';

interface Props {
  agents: LeaderboardAgent[];
  chainId: number;
  loading?: boolean;
}

export default function LeaderboardTable({ agents, chainId, loading }: Props) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-14 w-full rounded-md"
            style={{ animationDelay: `${i * 0.07}s` }}
          />
        ))}
      </div>
    );
  }

  if (!agents.length) {
    return (
      <div className="text-center py-12 text-muted">
        No agents found. Try adjusting filters.
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-black/20">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-black/40 text-muted uppercase text-xs sticky top-0 font-semibold tracking-wider">
          <tr>
            <th className="px-6 py-4 font-medium border-b border-white/5">Rank</th>
            <th className="px-6 py-4 font-medium border-b border-white/5">Agent</th>
            <th className="px-6 py-4 font-medium border-b border-white/5 text-right">Trust Score</th>
            <th className="px-6 py-4 font-medium border-b border-white/5 text-right">Success Rate</th>
            <th className="px-6 py-4 font-medium border-b border-white/5 text-right">Total Tasks</th>
            <th className="px-6 py-4 font-medium border-b border-white/5 text-right">Age (Days)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {agents.map((a) => (
            <tr key={a.agentId} onClick={() => window.location.href = `/agents/${chainId}/${a.agentId}`} className="hover:bg-white/5 cursor-pointer transition-colors group">
              <td className="px-6 py-4">
                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${a.rank === 1 ? 'bg-primary text-black shadow-[0_0_10px_var(--color-primary)]' : a.rank === 2 ? 'bg-zinc-300 text-black' : a.rank === 3 ? 'bg-orange-400 text-black' : 'bg-white/10 text-muted'}`}>
                  {a.rank}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <img src={resolveIPFS(a.image)} alt={a.name} className="w-10 h-10 rounded-full border border-border group-hover:border-primary transition-colors" onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%231E293B"/%3E%3C/svg%3E'; }} />
                  <div className="flex flex-col">
                    <span className="font-bold text-white mb-1 group-hover:text-primary transition-colors">{a.name}</span>
                    <div className="flex gap-1 flex-wrap max-w-[200px]">
                      {(a.domains ?? []).slice(0, 2).map((d) => <Badge key={d} variant="muted" className="text-[10px] py-0 px-1 border-white/10 bg-white/5">{d.split('/').pop()}</Badge>)}
                      {a.hasOASF && <Badge variant="success" className="text-[10px] py-0 px-1 bg-success/20">OASF</Badge>}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end">
                  <span className="font-bold text-primary text-base">{a.trustScore.toFixed(1)}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="text-white font-medium">{(a.successRate * 100).toFixed(1)}%</span>
                  <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-success" style={{ width: `${a.successRate * 100}%` }} />
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-right text-muted tabular-nums">{a.totalTasks.toLocaleString()}</td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                {a.active ? <CheckCircle size={16} className="text-success" /> : <XCircle size={16} className="text-danger" />}
                {a.x402Support && <Badge variant="primary" className="text-[10px] py-0 px-1">x402</Badge>}
              </td>
            </tr>
          ))}
          {agents.length === 0 && !loading && (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center text-muted">
                No agents found matching your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
