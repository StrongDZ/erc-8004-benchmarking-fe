'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, Chain, formatScore, truncateAddress } from '@/shared/api/client';
import type { FeedbackAgent } from '@/shared/api/types';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import { AgentAvatar } from '@/shared/ui/AgentAvatar';
import { ChainBadge } from '@/shared/ui/ChainBadge';
import { PaginatedSidebarCard } from '@/shared/ui/PaginatedSidebarCard';

interface Props {
  address: string;
  chains?: Chain[];
}

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

export default function FeedbackAgentsSidebar({ address, chains = [] }: Props) {
  const [data, setData] = useState<FeedbackAgent[]>([]);
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
      .feedbackAgents(address, page, PAGE_SIZE)
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
  }, [address, page]);

  return (
    <PaginatedSidebarCard
      title="Feedback Agents"
      total={total}
      loading={loading}
      page={page}
      pageSize={PAGE_SIZE}
      onPageChange={setPage}
      emptyMessage="No agents have received feedback from this wallet."
    >
      {data.map((row) => {
        const chain = chainMap.get(row.chainId);
        const label = row.agentName || `Agent #${row.agentId}`;
        return (
          <li key={`${row.chainId}:${row.agentId}`}>
            <Link
              href={`/agents/${row.chainId}/${row.agentId}`}
              className="flex items-center justify-between gap-2 rounded-md border border-transparent px-2 py-2 text-sm transition-colors hover:border-border hover:bg-white/5 group"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ChainBadge chainId={row.chainId} chain={chain} size="sm" className="shrink-0" />
                <AgentAvatar
                  seed={row.agentId}
                  size={28}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full border border-border group-hover:border-primary transition-colors"
                />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-white group-hover:text-primary transition-colors" title={label}>
                    {label}
                  </span>
                  <span className="block truncate text-2xs text-subtle font-mono">
                    #{truncateAddress(row.agentId, 4)}
                  </span>
                  <span className="tabular-nums text-2xs text-muted">
                    {row.feedbackCount} {row.feedbackCount === 1 ? 'feedback' : 'feedbacks'}
                  </span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-heading text-sm font-bold tabular-nums text-primary leading-none">
                  {formatScore(row.trustScore)}
                  <span className="text-3xs font-normal text-muted ml-0.5">/100</span>
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </PaginatedSidebarCard>
  );
}
