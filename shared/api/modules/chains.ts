import { apiFetch } from '@/shared/api/core/http';
import type { ChainCore } from '@/shared/api/types';

export const chainsApi = {
    chains: () => apiFetch<ChainCore[]>('/chains'),
};
