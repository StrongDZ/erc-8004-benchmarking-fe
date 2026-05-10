import { apiFetch } from '@/shared/api/core/http';
import type { OASFFacetTree } from '@/shared/api/types';

export const oasfApi = {
    oasfFacets: (chainId: number) =>
        apiFetch<OASFFacetTree>(`/oasf/facets?chainId=${chainId}`),
};
