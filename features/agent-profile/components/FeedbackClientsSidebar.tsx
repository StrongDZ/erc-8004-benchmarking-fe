'use client';

import { useEffect, useState } from 'react';
import { api, formatScore } from '@/shared/api/client';
import type { FeedbackClient } from '@/shared/api/types';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import { AddressLabel } from '@/shared/ui/AddressLabel';
import { PaginatedSidebarCard } from '@/shared/ui/PaginatedSidebarCard';
import { getScoreColorClass } from '@/shared/lib/compositeScore';

interface Props {
  chainId: number;
  agentId: string;
}

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

function ClientRow({ row }: { row: FeedbackClient }) {
    return (
        <li>
            <div className="flex items-center justify-between gap-2 rounded-md border border-transparent px-3 py-2.5 text-sm transition-colors hover:border-border hover:bg-white/5 group">
                <AddressLabel
                    address={row.clientAddress}
                    chars={8}
                    avatarSize={20}
                    className="min-w-0 truncate font-mono text-white group-hover:text-primary transition-colors"
                />
                <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className={`font-heading text-sm font-bold tabular-nums leading-none ${getScoreColorClass(row.trustScore)}`}>
                        {formatScore(row.trustScore)}
                        <span className="text-3xs font-normal text-muted ml-0.5">/100</span>
                    </span>
                    <span className="tabular-nums text-2xs text-muted">
                        {row.feedbackCount} {row.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
                    </span>
                </span>
            </div>
        </li>
    );
}

export default function FeedbackClientsSidebar({ chainId, agentId }: Props) {
  const [data, setData] = useState<FeedbackClient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [chainId, agentId]);

  useEffect(() => {
    setLoading(true);
    api
      .feedbackClients(chainId, agentId, page, PAGE_SIZE)
      .then((r) => {
        if (r.success) {
          setData(r.data ?? []);
          setTotal(r.meta?.total ?? 0);
        } else {
          setData([]);
          setTotal(0);
        }
      })
      .catch(() => {
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [chainId, agentId, page]);

  return (
    <PaginatedSidebarCard
      title="Feedback Wallets"
      total={total}
      loading={loading}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      emptyMessage="No wallets have submitted feedback yet."
    >
      {data.map((row) => (
        <ClientRow key={row.clientAddress} row={row} />
      ))}
    </PaginatedSidebarCard>
  );
}
