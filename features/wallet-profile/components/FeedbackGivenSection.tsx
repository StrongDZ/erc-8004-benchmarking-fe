'use client';
import { FileText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { api, Chain, WalletFeedback, explorerUrl } from '@/shared/api/client';
import { ensureHttpsUrl } from '@/shared/api/utils/format';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import { truncateFeedbackMiddle } from '@/shared/lib/feedbackDisplay';
import { formatFeedbackTableDate } from '@/shared/lib/feedbackTimestamp';
import {
  feedbackClassificationTitle,
  resolveFeedbackDisplayCategory,
} from '@/shared/lib/feedbackClassification';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import PageNavigation from '@/shared/ui/PageNavigation';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Badge } from '@/shared/ui/Badge';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { FeedbackCategoryBadge, FeedbackValuePill, FeedbackContentCell } from '@/shared/ui/feedback';

interface Props {
  address: string;
  chains?: Chain[];
  onTotalChange?: (total: number) => void;
}

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;
const COL_COUNT = 14;

export default function FeedbackGivenSection({ address, chains = [], onTotalChange }: Props) {
  const [data, setData] = useState<WalletFeedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const chainMap = useMemo(() => new Map(chains.map((c) => [c.chainId, c])), [chains]);

  useEffect(() => {
    setPage(1);
  }, [address]);

  useEffect(() => {
    setLoading(true);
    api
      .feedbackGiven(address, page, PAGE_SIZE)
      .then((r) => {
        if (r.success) {
          const items = r.data ?? [];
          const t = r.meta?.total ?? items.length;
          setData(items);
          setTotal(t);
          onTotalChange?.(t);
        } else {
          setData([]);
          setTotal(0);
          onTotalChange?.(0);
        }
      })
      .catch(() => {
        setData([]);
        setTotal(0);
        onTotalChange?.(0);
      })
      .finally(() => setLoading(false));
  }, [address, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card p-5">
      <h2 className="font-heading text-lg text-white flex items-center gap-2 mb-4">
        Feedback Given
        {!loading && (
          <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">{total}</span>
        )}
      </h2>

      <div className="w-full overflow-visible rounded-lg border border-border bg-black/20">
        <div className="overflow-x-auto overscroll-x-contain pb-32 -mb-32">
          <table className="data-table w-full min-w-[1300px] text-sm">
          <colgroup>
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '5.5%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '3.5%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <th className="whitespace-nowrap px-2 py-2.5 w-[4rem]">#</th>
              <th className="whitespace-nowrap px-2 py-2.5">Category</th>
              <th className="whitespace-nowrap px-2 py-2.5">Revoked</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tag1</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[6rem]">Tag2</th>
              <th className="whitespace-nowrap px-2 py-2.5">Chain</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[7rem]">Agent</th>
              <th className="whitespace-nowrap px-2 py-2.5">Time</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[7.5rem] max-w-[9rem]">Tx</th>
              <th className="whitespace-nowrap px-2 py-2.5 min-w-[8rem] max-w-[14rem]">Endpoint</th>
              <th className="whitespace-nowrap px-2 py-2.5 text-center w-[3rem]">URI</th>
              <th className="whitespace-nowrap px-2 py-2.5">Content</th>
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
                const agentTitle = fb.agentName ?? `Agent #${fb.agentId}`;
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
                    <td className="whitespace-nowrap px-2 py-2.5 align-middle">
                      <ChainBadge chainId={fb.chainId} chain={chainMap.get(fb.chainId)} size="sm" className="max-w-full" />
                    </td>
                    <td className="max-w-0 px-2 py-2.5 align-middle">
                      <LinkOutbound
                        href={`/agents/${fb.chainId}/${fb.agentId}`}
                        className="block w-full min-w-0 font-semibold text-primary hover:underline truncate"
                        title={agentTitle}
                      >
                        {agentTitle}
                      </LinkOutbound>
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 align-middle text-xs text-subtle">
                      {formatFeedbackTableDate(fb.timestamp, fb.timestampUnix)}
                    </td>
                    <td className="max-w-0 px-2 py-2.5 align-middle">
                      {fb.txHash ? (
                        <LinkOutbound
                          href={explorerUrl(fb.chainId, fb.txHash)}
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
                  No feedback records found for this wallet address.
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
