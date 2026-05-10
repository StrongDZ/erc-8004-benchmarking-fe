import { apiFetch } from '@/shared/api/core/http';
import type { IndexerStatusResponse } from '@/shared/api/types';

export const adminApi = {
    indexerStatus: () => apiFetch<IndexerStatusResponse>('/admin/indexer-status'),
};
