// shared/api/oasf-schema.ts
// OASF taxonomy client — reads from the backend (GET /oasf/schema/skills and /domains)
// which caches the data from schema.oasf.outshift.com and refreshes weekly.
// Callers are unchanged: oasfSchema.skills(), oasfSchema.domains(), flattenFacetCounts().

import { env } from '@/shared/config/env';

const API_BASE = env.apiBaseUrl;

export interface OASFEntry {
    // Full hierarchical name (e.g. "natural_language_processing/ethical_interaction").
    // Matches agent.oasfSkills / agent.oasfDomains on the BE.
    key: string;
    shortName: string;
    caption: string;
    description: string;
    uid: number;
    category: string;
    categoryName: string;
    depth: number;
    parentKey?: string;
}

async function fetchSchema(path: string): Promise<OASFEntry[]> {
    const res = await fetch(`${API_BASE}${path}`, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`oasf schema ${path}: ${res.status}`);
    const json = await res.json() as { data?: OASFEntry[] };
    return json.data ?? [];
}

// Small in-memory cache: the schema rarely changes and popups may open/close
// repeatedly within a session. Never revalidates inside a tab.
let skillsCache: Promise<OASFEntry[]> | null = null;
let domainsCache: Promise<OASFEntry[]> | null = null;

export const oasfSchema = {
    skills(): Promise<OASFEntry[]> {
        if (!skillsCache) {
            skillsCache = fetchSchema('/oasf/schema/skills')
                .catch((err) => { skillsCache = null; throw err; });
        }
        return skillsCache;
    },
    domains(): Promise<OASFEntry[]> {
        if (!domainsCache) {
            domainsCache = fetchSchema('/oasf/schema/domains')
                .catch((err) => { domainsCache = null; throw err; });
        }
        return domainsCache;
    },
};

// Flatten the BE facet tree into a { key → count } map for easy joining with
// entries from the schema API.
export function flattenFacetCounts(nodes: Array<{ key: string; count: number; children?: any[] }> | undefined | null): Record<string, number> {
    const out: Record<string, number> = {};
    function walk(list: Array<{ key: string; count: number; children?: any[] }>) {
        for (const n of list) {
            out[n.key] = n.count;
            if (n.children && n.children.length) walk(n.children as any);
        }
    }
    if (nodes) walk(nodes);
    return out;
}
