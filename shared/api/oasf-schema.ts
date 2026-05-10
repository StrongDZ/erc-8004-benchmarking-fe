// shared/api/oasf-schema.ts
// Client for the public OASF schema API (https://schema.oasf.outshift.com).
// Uses the category endpoints (each top-level class has `depth === 0` and its
// own caption/description, so the UI can render the taxonomy without a separate
// group header):
//   - /skill_categories
//   - /domain_categories
//
// Returned entries are flattened while preserving tree metadata (depth/parent).
// The hierarchical `key` matches what the BE stores on each agent (`oasfSkills`,
// `oasfDomains`) so counts from `/oasf/facets` can be joined by key.

const OASF_SCHEMA_BASE = 'https://schema.oasf.outshift.com/api/1.0.0';

export interface OASFEntry {
    // Full hierarchical name (e.g. "natural_language_processing/ethical_interaction").
    // This is the key that matches agent.oasfSkills / agent.oasfDomains on the BE.
    key: string;
    // Leaf name (e.g. "ethical_interaction").
    shortName: string;
    caption: string;
    description: string;
    uid: number;
    category: string;
    categoryName: string;
    depth: number;
    parentKey?: string;
    extends?: string;
}

interface RawCategoryNode {
    id?: number;
    name?: string;
    caption?: string;
    description?: string;
    classes?: Record<string, RawCategoryNode>;
}

function parseEntries(raw: Record<string, RawCategoryNode>): OASFEntry[] {
    const out: OASFEntry[] = [];
    function visit(
        tree: Record<string, RawCategoryNode>,
        depth: number,
        categoryKey: string,
        categoryName: string,
        parentKey?: string,
    ) {
        for (const shortName of Object.keys(tree)) {
            const r = tree[shortName];
            if (!r || typeof r !== 'object') continue;
            const key = r.name ?? shortName;
            const nextCategoryKey = depth === 0 ? key : categoryKey;
            const nextCategoryName = depth === 0 ? (r.caption ?? shortName) : categoryName;
            out.push({
                key,
                shortName: key.split('/').pop() ?? shortName,
                caption: r.caption ?? shortName,
                description: r.description ?? '',
                uid: typeof r.id === 'number' ? r.id : 0,
                category: nextCategoryKey,
                categoryName: nextCategoryName,
                depth,
                parentKey,
            });
            if (r.classes && typeof r.classes === 'object') {
                visit(r.classes, depth + 1, nextCategoryKey, nextCategoryName, key);
            }
        }
    }
    visit(raw, 0, '', '');
    return out;
}

async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url, { headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`oasf schema ${url}: ${res.status}`);
    return (await res.json()) as T;
}

// Small in-memory cache: the schema rarely changes and popups may open/close
// repeatedly within a session. Never revalidates inside a tab.
let skillsCache: Promise<OASFEntry[]> | null = null;
let domainsCache: Promise<OASFEntry[]> | null = null;

export const oasfSchema = {
    skills(): Promise<OASFEntry[]> {
        if (!skillsCache) {
            skillsCache = fetchJson<Record<string, RawCategoryNode>>(`${OASF_SCHEMA_BASE}/skill_categories`)
                .then(parseEntries)
                .catch((err) => { skillsCache = null; throw err; });
        }
        return skillsCache;
    },
    domains(): Promise<OASFEntry[]> {
        if (!domainsCache) {
            domainsCache = fetchJson<Record<string, RawCategoryNode>>(`${OASF_SCHEMA_BASE}/domain_categories`)
                .then(parseEntries)
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
