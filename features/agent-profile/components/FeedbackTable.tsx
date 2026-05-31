'use client';
import { FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { api, Feedback, explorerUrl, truncateAddress } from '@/shared/api/client';
import { ensureHttpsUrl } from '@/shared/api/utils/format';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
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
import { FeedbackCategoryBadge, FeedbackValuePill, FeedbackContentCell } from '@/shared/ui/feedback';

interface Props {
  chainId: number;
  agentId: string;
}

const CATEGORIES = ['all', 'service_feedback', 'config_feedback', 'app_specific', 'junk', 'others'] as const;

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

const COL_COUNT = 12;

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

      <div className="w-full overflow-visible rounded-lg border border-border bg-black/20">
        <div className="overflow-x-auto overscroll-x-contain pb-32 -mb-32">
          <table className="data-table w-full min-w-[1200px] text-sm">
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '4%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">#</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Category</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Revoked</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Tag1</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Tag2</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Client</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Time</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Tx</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Endpoint</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 text-center">URI</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5">Content</th>
              <th scope="col" className="whitespace-nowrap px-2 py-2.5 !text-center">Value</th>
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
                const commentText = fb.feedbackParsed?.comment;
                const attachments = Array.isArray(fb.feedbackParsed?.attachments) ? fb.feedbackParsed.attachments : [];
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
                    <td className="max-w-0 px-2 py-2.5 align-middle">
                      <LinkOutbound
                        href={`/wallet/${fb.clientAddress}`}
                        className="block w-full min-w-0 font-mono text-xs text-muted hover:text-primary truncate"
                        title={fb.clientAddress}
                      >
                        {truncateAddress(fb.clientAddress)}
                      </LinkOutbound>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 align-middle text-xs text-subtle">
                      {formatFeedbackTableDate(fb.timestamp, fb.timestampUnix)}
                    </td>
                    <td className="max-w-0 px-2 py-2.5 align-middle">
                      {fb.txHash ? (
                        <LinkOutbound
                          href={explorerUrl(chainId, fb.txHash)}
                          external
                          className="block w-full min-w-0 font-mono text-xs text-muted hover:text-primary truncate"
                          title={fb.txHash}
                        >
                          {truncateFeedbackMiddle(fb.txHash, 12, 6)}
                        </LinkOutbound>
                      ) : (
                        <span className="text-subtle">—</span>
                      )}
                    </td>
                    <td className="max-w-0 px-2 py-2.5 align-middle">
                      {host && fb.endpoint?.trim() ? (
                        <LinkOutbound
                          href={ensureHttpsUrl(fb.endpoint)}
                          external
                          className="block w-full min-w-0 font-mono text-xs text-muted hover:text-primary truncate"
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
                    <td className="px-2 py-2.5 align-middle !overflow-visible">
                      <FeedbackContentCell comment={commentText} attachments={attachments} />
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
