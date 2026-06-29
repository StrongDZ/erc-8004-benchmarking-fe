'use client';

import { useState, useEffect, useMemo } from 'react';
import { MessageSquareOff } from 'lucide-react';
import { api } from '@/shared/api/client';
import type { Feedback } from '@/shared/api/types';
import type { ServiceOverview } from '@/shared/api/response-types';
import { DEFAULT_FEEDBACK_PAGE_SIZE } from '@/shared/constants/app';
import PageNavigation from '@/shared/ui/PageNavigation';
import { FilterSelect, type FilterSelectOption } from '@/shared/ui/FilterSelect';
import {
  FEEDBACK_FILTER_CATEGORIES,
  feedbackCategoryFilterLabel,
} from '@/shared/lib/feedback/feedbackCategories';
import { FeedbackCard } from './FeedbackCard';
import { FeedbackCardSkeleton } from './FeedbackCardSkeleton';

interface FeedbackFeedProps {
  chainId: number;
  agentId: string;
  initialServiceEndpoint?: string;
  onServiceFilterChange?: (endpoint: string) => void;
}

const PAGE_SIZE = DEFAULT_FEEDBACK_PAGE_SIZE;

function serviceFilterLabel(svc: ServiceOverview): string {
  const name = svc.name?.trim();
  if (name) return name;
  const ep = svc.endpoint?.trim();
  if (!ep) return 'Unnamed service';
  try {
    const url = new URL(ep.startsWith('http') ? ep : `https://${ep}`);
    return url.pathname === '/' ? url.host : `${url.host}${url.pathname}`;
  } catch {
    return ep.length > 40 ? `${ep.slice(0, 37)}…` : ep;
  }
}

export default function FeedbackFeed({
  chainId,
  agentId,
  initialServiceEndpoint,
  onServiceFilterChange,
}: FeedbackFeedProps) {
  const [data, setData] = useState<Feedback[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>('all');
  const [serviceEndpoint, setServiceEndpoint] = useState<string>(
    initialServiceEndpoint && initialServiceEndpoint !== 'all' ? initialServiceEndpoint : 'all',
  );
  const [serviceOptions, setServiceOptions] = useState<ServiceOverview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.agentOverview(chainId, agentId).then((r) => {
      const withEndpoint = (r.data?.services ?? []).filter((s) => s.endpoint?.trim());
      setServiceOptions(withEndpoint);
    });
  }, [chainId, agentId]);

  useEffect(() => {
    if (!initialServiceEndpoint || initialServiceEndpoint === 'all') return;
    setServiceEndpoint(initialServiceEndpoint);
    setPage(1);
  }, [initialServiceEndpoint]);

  const categoryOptions = useMemo<FilterSelectOption[]>(
    () =>
      FEEDBACK_FILTER_CATEGORIES.map((c) => ({
        value: c,
        label: feedbackCategoryFilterLabel(c),
      })),
    [],
  );

  const serviceSelectOptions = useMemo<FilterSelectOption[]>(() => {
    const opts: FilterSelectOption[] = [
      { value: 'all', label: 'All services' },
    ];
    for (const svc of serviceOptions) {
      const ep = svc.endpoint?.trim();
      if (!ep) continue;
      opts.push({
        value: ep,
        label: serviceFilterLabel(svc),
        description: ep,
      });
    }
    return opts;
  }, [serviceOptions]);

  const showServiceFilter = serviceSelectOptions.length > 1;

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
    if (category !== 'all') params.category = category;
    if (serviceEndpoint !== 'all') params.service = serviceEndpoint;
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
  }, [chainId, agentId, page, category, serviceEndpoint]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleCategoryChange = (next: string) => {
    setCategory(next);
    setPage(1);
  };

  const handleServiceChange = (endpoint: string) => {
    setServiceEndpoint(endpoint);
    setPage(1);
    onServiceFilterChange?.(endpoint);
  };

  return (
    <div className="card p-5 min-w-0 flex flex-col lg:max-h-[calc(100vh-10.5rem)]">
      <div className="shrink-0 flex flex-col gap-4 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
          <h3 className="font-heading text-lg text-white flex items-center gap-2 shrink-0">
            Feedbacks
            <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md tabular-nums">
              {total}
            </span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-2 w-full lg:w-auto lg:max-w-md">
            <FilterSelect
              className="sm:flex-1 sm:min-w-[8.5rem]"
              label="Category"
              value={category}
              options={categoryOptions}
              onChange={handleCategoryChange}
              placeholder="All"
            />
            {showServiceFilter && (
              <FilterSelect
                className="sm:flex-1 sm:min-w-[8.5rem]"
                label="Service"
                value={serviceEndpoint}
                options={serviceSelectOptions}
                onChange={handleServiceChange}
                placeholder="All services"
                searchable={serviceSelectOptions.length > 6}
              />
            )}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto space-y-3 pr-0.5 -mr-0.5">
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
          className="shrink-0 mt-4 border-t border-border pt-4"
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
