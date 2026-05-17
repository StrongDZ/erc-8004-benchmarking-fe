import { apiFetch } from '@/shared/api/core/http';
import type { OffchainByUriData } from '@/shared/api/response-types';

export const offchainApi = {
    offchainByUri: (uri: string) =>
        apiFetch<OffchainByUriData>(`/offchain-by-uri?uri=${encodeURIComponent(uri)}`),
};
