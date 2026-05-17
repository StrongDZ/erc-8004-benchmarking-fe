'use client';
import { FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Feedback, explorerUrl, truncateAddress } from '@/shared/api/client';
import { truncateFeedbackMiddle } from '@/shared/lib/feedbackDisplay';
import { formatFeedbackTableDate } from '@/shared/lib/feedbackTimestamp';
import {
  feedbackClassificationTitle,
  resolveFeedbackDisplayCategory,
} from '@/shared/lib/feedbackClassification';
import PageNavigation from '@/shared/ui/PageNavigation';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Badge } from '@/shared/ui/Badge';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { FeedbackCategoryBadge, FeedbackValuePill } from '@/shared/ui/feedback';

interface Props {
  chainId: number;
  agentId: string;
}

const CATEGORIES = ['all', 'service_feedback', 'config_feedback', 'app_specific', 'spam', 'others'] as const;

const PAGE_SIZE = 10;

const COL_COUNT = 11;

export default function FeedbackTable({ chainId, agentId }: Props) {
  const [data, setData] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (category !== 'all') params.category = category;
    api.feedbacks(chainId, agentId, params).then((r) => {
      if (r.success) {
        setData(r.data ?? []);
        setTotal(r.meta?.total ?? 0);
      }
      setLoading(false);
    });
  }, [chainId, agentId, page, category]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-heading text-lg text-white flex items-center gap-2">
          Feedbacks
          <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">{total}</span>
        </h3>
        <div className="overflow-x-auto">
          <div className="tabs">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`tab-btn ${category === c ? 'active' : ''}`}
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
              >
                {c === 'all' ? 'All' : c.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto overscroll-x-contain rounded-lg border border-border bg-black/20">
        <table className="data-table w-full min-w-[880px] text-sm">
          <colgroup>
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '8.5%' }} />
            <col style={{ width: '10.5%' }} />
            <col style={{ width: '9.5%' }} />
            <col style={{ width: '10.5%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="whitespace-nowrap px-2 py-2.5 w-[4rem]">#</th>
              <th className="whitespace-nowrap px-2 py-2.5">Category</th>
              <th className="whitespace-nowrap px-2 py-2.5">Revoked</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tag1</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tag2</th>
              <th className="whitespace-nowrap px-2 py-2.5">Client</th>
              <th className="whitespace-nowrap px-2 py-2.5">Time</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[7.5rem] max-w-[9rem]">Tx</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[8rem] max-w-[14rem]">Endpoint</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-center w-[3rem]">URI</th>
              <th className="whitespace-nowrap px-2 py-2.5 !text-center min-w-[8rem]">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={COL_COUNT} className="px-2 py-2">
                    <Skeleton className="h-10 w-full rounded-md" />
                  </td>
                </tr>
              ))}

            {!loading &&
              data.map((fb) => {
                const isRevoked = !!fb.revokeTxHash;
                const host = fb.endpoint?.replace(/^https?:\/\//, '') ?? '';
                return (
                  <tr key={fb._id} className={isRevoked ? 'opacity-60' : undefined}>
                    <td className="whitespace-nowrap px-2 py-2.5 align-middle font-mono text-subtle tabular-nums">
                      #{fb.feedbackIndex}
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      <FeedbackCategoryBadge
                        category={resolveFeedbackDisplayCategory(fb.classification)}
                        title={feedbackClassificationTitle(fb.classification)}
                        badgeSize="xs"
                      />
                    </td>
                    <td className="px-2 py-2.5 align-middle">
                      {isRevoked ? (
                        <Badge variant="danger" size="xs">
                          Revoked
                        </Badge>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle max-w-[10rem]">
                      <span className="block truncate text-xs text-muted" title={fb.tag1 || undefined}>
                        {fb.tag1?.trim() ? fb.tag1 : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2.5 align-middle max-w-[10rem]">
                      <span className="block truncate text-xs text-muted" title={fb.tag2 || undefined}>
                        {fb.tag2?.trim() ? fb.tag2 : '—'}
                      </span>
                    </td>
                    <td className="min-w-0 px-2 py-2.5 align-middle">
                      <LinkOutbound
                        href={`/wallet/${fb.clientAddress}`}
                        className="inline-flex w-full min-w-0 font-mono text-xs text-muted hover:text-primary"
                        title={fb.clientAddress}
                      >
                        {truncateAddress(fb.clientAddress)}
                      </LinkOutbound>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 align-middle text-xs text-subtle">
                      {formatFeedbackTableDate(fb.timestamp, fb.timestampUnix)}
                    </td>
                    <td className="min-w-0 px-2 py-2.5 align-middle">
                      {fb.txHash ? (
                        <LinkOutbound
                          href={explorerUrl(chainId, fb.txHash)}
                          external
                          className="inline-flex w-full min-w-0 font-mono text-xs text-muted hover:text-primary"
                          title={fb.txHash}
                        >
                          {truncateFeedbackMiddle(fb.txHash, 12, 6)}
                        </LinkOutbound>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="min-w-0 px-2 py-2.5 align-middle">
                      {host && fb.endpoint?.trim() ? (
                        <LinkOutbound
                          href={/^https?:\/\//i.test(fb.endpoint.trim()) ? fb.endpoint.trim() : `https://${fb.endpoint.trim()}`}
                          external
                          className="inline-flex w-full min-w-0 font-mono text-xs text-muted hover:text-primary"
                          title={fb.endpoint}
                        >
                          {truncateFeedbackMiddle(host, 24, 10)}
                        </LinkOutbound>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center">
                      {fb.feedbackURI ? (
                        <LinkOutbound
                          href={`/feedback-uri?uri=${encodeURIComponent(fb.feedbackURI)}`}
                          className="inline-flex text-muted hover:text-accent p-0.5"
                          title="Feedback URI"
                        >
                          <FileText size={16} />
                        </LinkOutbound>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 align-middle text-center">
                      <div className="flex justify-center">
                        <FeedbackValuePill fb={fb} revoked={isRevoked} />
                      </div>
                    </td>
                  </tr>
                );
              })}

            {!loading && data.length === 0 && (
              <tr>
                <td colSpan={COL_COUNT} className="py-10 text-center text-muted text-sm">
                  No feedbacks found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <PageNavigation
          className="mt-6 border-t border-border pt-4"
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
