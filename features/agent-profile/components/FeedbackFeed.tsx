'use client';

import { useState, useEffect } from 'react';
import { MessageSquareOff } from 'lucide-react';
import { api } from '@/shared/api/client';
import type { Feedback } from '@/shared/api/types';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import PageNavigation from '@/shared/ui/PageNavigation';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackCardSkeleton } from './FeedbackCardSkeleton';

interface FeedbackFeedProps {
  chainId: number;
  agentId: string;
}

const CATEGORIES = ['all', 'service_feedback', 'config_feedback', 'app_specific', 'junk', 'others'] as const;
const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

export default function FeedbackFeed({ chainId, agentId }: FeedbackFeedProps) {
  const [data, setData] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (category !== 'all') params.category = category;
    api.feedbacks(chainId, agentId, params)
      .then((r) => {
        if (r.success) {
          setData(r.data ?? []);
          setTotal(r.meta?.total ?? 0);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [chainId, agentId, page, category]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="card p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <h3 className="font-heading text-lg text-white flex items-center gap-2">
          Feedbacks
          <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">
            {total}
          </span>
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

      <div className="space-y-3">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => <FeedbackCardSkeleton key={i} />)}

        {!loading &&
          data.map((fb) => (
            <FeedbackCard key={fb._id} feedback={fb} chainId={chainId} />
          ))}

        {!loading && data.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-subtle">
            <MessageSquareOff size={40} strokeWidth={1.2} />
            <p className="text-sm">No feedbacks found for this filter.</p>
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
  );
}
