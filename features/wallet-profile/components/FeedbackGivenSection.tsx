'use client';

import { MessageSquareOff } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { api, Chain, WalletFeedback } from '@/shared/api/client';
import FeedbackAgentsSidebar from '@/features/wallet-profile/components/FeedbackAgentsSidebar';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import PageNavigation from '@/shared/ui/PageNavigation';
import { FeedbackCard } from '@/features/agent-profile/components/FeedbackCard';
import { FeedbackCardSkeleton } from '@/features/agent-profile/components/FeedbackCardSkeleton';

interface Props {
  address: string;
  chains?: Chain[];
  onTotalChange?: (total: number) => void;
}

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

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
  }, [address, page, onTotalChange]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
      <div className="card p-5">
        <h2 className="font-heading text-lg text-white flex items-center gap-2 mb-4">
          Feedback Given
          {!loading && (
            <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">{total}</span>
          )}
        </h2>

        <div className="space-y-3">
          {loading &&
            Array.from({ length: 4 }).map((_, i) => <FeedbackCardSkeleton key={i} />)}

          {!loading &&
            data.map((fb) => (
              <FeedbackCard
                key={fb._id}
                feedback={fb}
                chainId={fb.chainId}
                variant="to-agent"
                agentId={fb.agentId}
                agentName={fb.agentName}
                chain={chainMap.get(fb.chainId)}
              />
            ))}

          {!loading && data.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-14 text-subtle">
              <MessageSquareOff size={40} strokeWidth={1.2} />
              <p className="text-sm">No feedback records found for this wallet address.</p>
            </div>
          )}
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

      <FeedbackAgentsSidebar address={address} chains={chains} />
    </div>
  );
}
