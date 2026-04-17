'use client';
import { useState, useEffect } from 'react';
import { ExternalLink, FileText, RotateCcw } from 'lucide-react';
import { api, Feedback, truncateAddress, explorerUrl, resolveIPFS } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props { chainId: number; agentId: string; }

const CATEGORIES = ['all', 'service_feedback', 'config_feedback', 'app_specific', 'spam', 'others'];

export default function FeedbackTable({ chainId, agentId }: Props) {
  const [data, setData] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (category !== 'all') params.category = category;
    api.feedbacks(chainId, agentId, params).then(r => {
      if (r.success) { setData(r.data ?? []); setTotal(r.meta?.total ?? 0); }
      setLoading(false);
    });
  }, [chainId, agentId, page, category]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="card p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-heading text-lg text-white flex items-center gap-2">
          Feedbacks
          <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">{total}</span>
        </h3>
        <div className="overflow-x-auto">
          <div className="tabs">
            {CATEGORIES.map(c => (
              <button
                key={c}
                className={`tab-btn ${category === c ? 'active' : ''}`}
                onClick={() => { setCategory(c); setPage(1); }}
              >
                {c === 'all' ? 'All' : c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-white/5">
            {data.map(fb => (
              <div
                key={fb._id}
                className={`flex items-center justify-between gap-4 py-3 ${fb.revokeTxHash ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="text-xs font-mono text-subtle shrink-0 mt-1">#{fb.feedbackIndex}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <Badge variant="muted" style={{ fontSize: '0.68rem' }}>
                        {fb.classification?.category ?? 'unknown'}
                      </Badge>
                      {fb.revokeTxHash && <Badge variant="danger" style={{ fontSize: '0.68rem' }}>Revoked</Badge>}
                      {fb.vi < 0.5 && !fb.revokeTxHash && <Badge variant="danger" style={{ fontSize: '0.68rem' }}>Failed</Badge>}
                      {fb.vi >= 0.5 && !fb.revokeTxHash && <Badge variant="success" style={{ fontSize: '0.68rem' }}>Passed</Badge>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted font-mono">{truncateAddress(fb.clientAddress)}</span>
                      <span className="text-subtle">·</span>
                      <span className="text-subtle">wi={fb.wi.toFixed(2)}</span>
                      <span className="text-subtle">·</span>
                      <span className="text-subtle">{new Date(fb.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="font-mono text-sm font-semibold"
                    style={{ color: fb.vi >= 0.5 ? 'var(--color-success)' : 'var(--color-danger)' }}
                  >
                    vi={fb.vi.toFixed(1)}
                  </span>
                  <div className="flex items-center gap-1">
                    {fb.txHash && (
                      <a
                        href={explorerUrl(chainId, fb.txHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted hover:text-primary transition-colors p-1"
                        title="View on Explorer"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {fb.feedbackURI && (
                      <a
                        href={resolveIPFS(fb.feedbackURI)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted hover:text-accent transition-colors p-1"
                        title="View IPFS"
                      >
                        <FileText size={14} />
                      </a>
                    )}
                    {fb.revokeTxHash && (
                      <a
                        href={explorerUrl(chainId, fb.revokeTxHash)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted hover:text-danger transition-colors p-1"
                        title="Revoke Tx"
                      >
                        <RotateCcw size={14} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!data.length && !loading && (
              <div className="py-10 text-center text-muted text-sm">No feedbacks found</div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-5 pt-4 border-t border-border">
              <button className="pagination-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
              <span className="text-sm text-muted tabular-nums">{page} / {totalPages}</span>
              <button className="pagination-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
