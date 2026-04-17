'use client';
// features/leaderboard/components/DashboardFilters.tsx
// Horizontal filter bar for the new dashboard. All filters are multi-select
// except x402, which is tri-state (any/yes/no). State is fully controlled
// by the parent page.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { api, Chain, OASFFacet, OASFFacetTree } from '@/shared/api/client';
import { MultiSelect, MultiSelectOption } from '@/shared/ui/MultiSelect';
import { Button } from '@/shared/ui/Button';

export interface DashboardFilterValue {
    chainIds: number[];
    services: string[];
    oasfSkills: string[];
    oasfDomains: string[];
    tags: string[];
    // tri-state: undefined = any, true = only x402, false = only non-x402.
    x402?: boolean;
}

interface Props {
    chains: Chain[];
    value: DashboardFilterValue;
    onChange: (next: DashboardFilterValue) => void;
}

const SERVICE_OPTIONS: MultiSelectOption[] = [
    { value: 'email', label: 'Email' },
    { value: 'mcp', label: 'MCP' },
    { value: 'a2a', label: 'A2A' },
    { value: 'oasf', label: 'OASF' },
    { value: 'web', label: 'Web' },
];

// Flatten a flat list of OASFFacetNode into MultiSelectOption[].
// BE already separates skillNodes / domainNodes, so no prefix-filtering needed.
function nodesToOptions(nodes: OASFFacet[] | undefined): MultiSelectOption[] {
    if (!nodes || !Array.isArray(nodes)) return [];
    const walk = (n: OASFFacet): MultiSelectOption[] => [
        {
            value: n.key,
            label: n.name || n.label || n.key.split('/').pop() || n.key,
            hint: n.count,
        },
        ...(n.children ?? []).flatMap(walk),
    ];
    return nodes.flatMap(walk);
}

export default function DashboardFilters({ chains, value, onChange }: Props) {
    const [facets, setFacets] = useState<OASFFacetTree | null>(null);
    const [tagOptions, setTagOptions] = useState<MultiSelectOption[]>([]);

    // Stable string key to avoid re-firing effects on every parent re-render
    // (value.chainIds is a new array reference each render even if content is same).
    const chainKey = value.chainIds.join(',');

    // Load OASF facets — use first selected chain or fallback to 0 (API tolerates it).
    // Intentionally omit `chains` from deps: we only need the first chainId (via chainKey).
    // Including the `chains` array prop would re-fire whenever the parent re-renders.
    useEffect(() => {
        const cid = value.chainIds[0] ?? chains[0]?.chainId ?? 0;
        if (!cid) return;
        api.oasfFacets(cid).then((r) => { if (r.success) setFacets(r.data ?? null); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainKey]);

    // Initial tag list load (top tags in current chain scope).
    useEffect(() => {
        api.tags(value.chainIds, '', 50).then((r) => {
            if (r.success) setTagOptions((r.data ?? []).map((t) => ({ value: t.tag, label: t.tag, hint: t.count })));
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainKey]);

    const chainOptions = useMemo<MultiSelectOption[]>(
        () => chains.map((c) => ({ value: String(c.chainId), label: c.name, hint: c.agentCount })),
        [chains],
    );
    const skillOptions = useMemo(() => nodesToOptions(facets?.skillNodes), [facets]);
    const domainOptions = useMemo(() => nodesToOptions(facets?.domainNodes), [facets]);

    const activeCount =
        value.chainIds.length + value.services.length + value.oasfSkills.length +
        value.oasfDomains.length + value.tags.length + (value.x402 !== undefined ? 1 : 0);

    function reset() {
        onChange({ chainIds: [], services: [], oasfSkills: [], oasfDomains: [], tags: [], x402: undefined });
    }

    // useCallback ensures the function reference is stable between renders.
    // Without this, MultiSelect's `useEffect([query, onSearch])` would fire on every
    // render because a new `searchTags` function is created each time, causing an
    // infinite loop: setTagOptions → re-render → new searchTags → effect → API call → …
    const searchTags = useCallback(async (q: string) => {
        const r = await api.tags(value.chainIds, q, 50);
        if (r.success) setTagOptions((r.data ?? []).map((t) => ({ value: t.tag, label: t.tag, hint: t.count })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chainKey]);

    return (
        <section className="bg-background/50 border border-border rounded-xl p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-primary" />
                    <h2 className="text-base font-bold text-white">Filters</h2>
                    {activeCount > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">{activeCount}</span>
                    )}
                </div>
                {activeCount > 0 && (
                    <Button variant="outline" onClick={reset} className="gap-1.5 text-xs border-border text-danger hover:text-red-400">
                        <X size={12} /> Reset
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <MultiSelect
                    label="Chain"
                    placeholder="All chains"
                    options={chainOptions}
                    selected={value.chainIds.map(String)}
                    onChange={(next) => onChange({ ...value, chainIds: next.map((x) => Number(x)).filter((x) => !Number.isNaN(x)) })}
                />
                <MultiSelect
                    label="Services"
                    placeholder="Any service"
                    options={SERVICE_OPTIONS}
                    selected={value.services}
                    onChange={(next) => onChange({ ...value, services: next })}
                />
                <MultiSelect
                    label="OASF Skills"
                    placeholder="Any skill"
                    options={skillOptions}
                    selected={value.oasfSkills}
                    onChange={(next) => onChange({ ...value, oasfSkills: next })}
                />
                <MultiSelect
                    label="OASF Domains"
                    placeholder="Any domain"
                    options={domainOptions}
                    selected={value.oasfDomains}
                    onChange={(next) => onChange({ ...value, oasfDomains: next })}
                />
                <MultiSelect
                    label="Tags"
                    placeholder="Any tag"
                    options={tagOptions}
                    selected={value.tags}
                    onChange={(next) => onChange({ ...value, tags: next })}
                    onSearch={searchTags}
                />
                <div>
                    <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">x402 Supported</div>
                    <div className="flex items-center gap-1 bg-black/40 border border-border rounded-md p-1">
                        {([
                            { v: undefined, label: 'Any' },
                            { v: true, label: 'Yes' },
                            { v: false, label: 'No' },
                        ] as const).map((opt) => {
                            const active = value.x402 === opt.v;
                            return (
                                <button
                                    key={String(opt.label)}
                                    type="button"
                                    onClick={() => onChange({ ...value, x402: opt.v })}
                                    className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${active ? 'bg-primary text-black' : 'text-muted hover:text-white'}`}
                                >
                                    {opt.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
