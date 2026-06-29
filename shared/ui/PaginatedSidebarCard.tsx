'use client';

import type { ReactNode } from 'react';
import PageNavigation from '@/shared/ui/PageNavigation';

interface PaginatedSidebarCardProps {
  title: string;
  total: number;
  loading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  emptyMessage: string;
  children: ReactNode;
}

export function PaginatedSidebarCard({
  title,
  total,
  loading,
  page,
  pageSize,
  onPageChange,
  emptyMessage,
  children,
}: PaginatedSidebarCardProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <aside className="card p-5 min-w-0 lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-10.5rem)] lg:flex lg:flex-col">
      <h3 className="font-heading text-lg text-white flex items-center gap-2 mb-4 shrink-0">
        {title}
        {!loading && (
          <span className="text-sm font-normal text-muted bg-white/5 px-2 py-0.5 rounded-md">
            {total}
          </span>
        )}
      </h3>

      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-12 w-full rounded-md"
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      ) : total === 0 ? (
        <p className="text-sm text-muted py-6 text-center">{emptyMessage}</p>
      ) : (
        <>
          <ul className="flex flex-col gap-1.5 min-h-0 flex-1 overflow-y-auto pr-0.5 -mr-0.5">{children}</ul>
          {total > pageSize && (
            <PageNavigation
              className="shrink-0 mt-4 border-t border-border pt-3"
              page={page}
              totalPages={totalPages}
              loading={loading}
              onPageChange={onPageChange}
            />
          )}
        </>
      )}
    </aside>
  );
}
