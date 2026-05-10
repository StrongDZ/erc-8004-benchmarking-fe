'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FileText, RotateCcw } from 'lucide-react';
import { api, Feedback, truncateAddress, explorerUrl, resolveIPFS } from '@/shared/api/client';
import { Badge } from '@/shared/ui/Badge';
import { Skeleton } from '@/shared/ui/Skeleton';

interface Props { chainId: number; agentId: string; }

const CATEGORIES = ['all', 'service_feedback', 'config_feedback', 'app_specific', 'spam', 'others'];

// Derive display unit from tag1 when no explicit unit is stored.
const UNIT_BY_TAG: Record<string, string> = {
  responseTime: 'ms',
  processingTime: 's',
  blockDelay: 'blocks',
  uptime: '%',
  successRate: '%',
  confidence: '%',
  tps: 'tok/s',
  reachable: 'bool',
  ownerVerified: 'bool',
  kycCleared: 'bool',
};

function resolveUnit(fb: Feedback): string {
  if (fb.unit && fb.unit !== 'none') return fb.unit;
  if (fb.tag1 && UNIT_BY_TAG[fb.tag1]) return UNIT_BY_TAG[fb.tag1];
  return '';
}

function formatValue(fb: Feedback): string {
  const rawNum = parseInt(fb.value ?? '0', 10);
  if (isNaN(rawNum)) return fb.value ?? '—';

  const decimals = fb.valueDecimals ?? 0;
  const real = rawNum / Math.pow(10, decimals);
  const unit = resolveUnit(fb);

  if (unit === 'bool') return rawNum === 1 ? 'True' : 'False';
  if (unit === '%') return `${real.toFixed(decimals > 0 ? Math.min(decimals, 2) : 0)}%`;
  if (unit === 'tok/s') return `${real.toFixed(1)} tok/s`;
  if (unit === 'ms') return `${real.toFixed(0)} ms`;
  if (unit === 's') return `${real.toFixed(1)} s`;
  if (unit === 'blocks') return `${real.toFixed(0)} blk`;

  // Generic: show real value + unit suffix
  const formatted = decimals > 0 ? real.toFixed(Math.min(decimals, 4)) : String(real);
  return unit ? `${formatted} ${unit}` : formatted;
}

function scoreColor(vi: number, revoked: boolean): string {
  if (revoked) return 'bg-white/10 text-[color:var(--color-text-subtle)]';
  if (vi >= 0.8) return 'bg-success/15 text-success';
  if (vi >= 0.5) return 'bg-primary/15 text-primary';
  return 'bg-danger/15 text-danger';
}

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
      {/* Header */}
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
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-col divide-y divide-white/5">
            {data.map(fb => {
              const isRevoked = !!fb.revokeTxHash;
              const unit = resolveUnit(fb);

              return (
                <div
                  key={fb._id}
                  className={`flex items-center justify-between gap-3 py-3 ${isRevoked ? 'opacity-60' : ''}`}
                >
                  {/* Left: index + meta */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono text-subtle shrink-0 mt-0.5">
                      #{fb.feedbackIndex}
                    </span>

                    <div className="min-w-0 flex-1">
                      {/* Row 1: category + status badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge variant="muted" style={{ fontSize: '0.68rem' }}>
                          {fb.classification?.category ?? 'unknown'}
                        </Badge>
                        {isRevoked && (
                          <Badge variant="danger" style={{ fontSize: '0.68rem' }}>Revoked</Badge>
                        )}
                        {!isRevoked && fb.vi < 0.5 && (
                          <Badge variant="danger" style={{ fontSize: '0.68rem' }}>Failed</Badge>
                        )}
                        {!isRevoked && fb.vi >= 0.5 && (
                          <Badge variant="success" style={{ fontSize: '0.68rem' }}>Passed</Badge>
                        )}
                        {/* tag2 */}
                        {fb.tag2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-mono bg-white/5 text-muted border border-white/8">
                            {fb.tag2}
                          </span>
                        )}
                      </div>

                      {/* Row 2: client · date · txHash (clickable) · endpoint · ipfs · revoke */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
                        <Link
                          href={`/wallet/${fb.clientAddress}`}
                          className="font-mono text-muted hover:text-primary transition-colors"
                          title={fb.clientAddress}
                        >
                          {truncateAddress(fb.clientAddress)}
                        </Link>
                        <span>·</span>
                        <span>{new Date(fb.timestamp).toLocaleDateString()}</span>

                        {fb.txHash && (
                          <>
                            <span>·</span>
                            <a
                              href={explorerUrl(chainId, fb.txHash)}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono text-muted hover:text-primary transition-colors"
                              title="View transaction"
                            >
                              {fb.txHash.slice(0, 6)}…{fb.txHash.slice(-4)}
                            </a>
                          </>
                        )}

                        {fb.endpoint && (
                          <>
                            <span>·</span>
                            <span
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-[0.65rem] font-mono bg-primary/10 text-primary/70 border border-primary/20 max-w-[140px] truncate"
                              title={fb.endpoint}
                            >
                              {fb.endpoint.replace(/^https?:\/\//, '')}
                            </span>
                          </>
                        )}

                        {fb.feedbackURI && (
                          <a
                            href={resolveIPFS(fb.feedbackURI)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted hover:text-accent transition-colors"
                            title="View IPFS"
                          >
                            <FileText size={12} />
                          </a>
                        )}

                        {fb.revokeTxHash && (
                          <a
                            href={explorerUrl(chainId, fb.revokeTxHash)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted hover:text-danger transition-colors"
                            title="Revoke Tx"
                          >
                            <RotateCcw size={12} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: score pill */}
                  <div className="shrink-0 flex flex-col items-center gap-0.5">
                    <div
                      className={`w-14 h-14 rounded-full flex flex-col items-center justify-center ${scoreColor(fb.vi, isRevoked)} border border-border`}
                    >
                      <span className="text-[0.6rem] font-mono leading-none opacity-70 mb-0.5 truncate max-w-[48px] text-center px-0.5">
                        {fb.tag1 || unit || '—'}
                      </span>
                      <span className="text-sm font-semibold leading-none tabular-nums">
                        {formatValue(fb)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

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
