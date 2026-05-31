'use client';
// shared/ui/MultiSelect.tsx
// Generic multi-select dropdown with search + chip display. Intentionally framework-free
// (no radix / no headlessui) to stay within the existing dependency set.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';

export interface MultiSelectOption {
    value: string;
    label: string;
    hint?: string | number;
}

interface Props {
    label: string;
    options: MultiSelectOption[];
    selected: string[];
    onChange: (next: string[]) => void;
    placeholder?: string;
    searchable?: boolean;
    emptyLabel?: string;
    // Optional async search callback; when set, typing into the box fires this
    // instead of filtering `options` client-side. Result replaces `options`.
    onSearch?: (query: string) => void;
    maxVisibleChips?: number;
}

export function MultiSelect({
    label, options, selected, onChange,
    placeholder = 'Any', searchable = true,
    emptyLabel = 'No matches',
    onSearch,
    maxVisibleChips = 3,
}: Props) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handler(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (!onSearch) return;
        const h = setTimeout(() => onSearch(query), 200);
        return () => clearTimeout(h);
    }, [query, onSearch]);

    const filtered = useMemo(() => {
        if (onSearch || !query) return options;
        const q = query.toLowerCase();
        return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.toLowerCase().includes(q));
    }, [options, query, onSearch]);

    const selectedSet = useMemo(() => new Set(selected), [selected]);

    function toggle(v: string) {
        if (selectedSet.has(v)) onChange(selected.filter((x) => x !== v));
        else onChange([...selected, v]);
    }

    function clearAll(e: React.MouseEvent) {
        e.stopPropagation();
        onChange([]);
    }

    // Build chip preview with overflow indicator.
    const chips = selected.slice(0, maxVisibleChips);
    const overflow = selected.length - chips.length;

    return (
        <div ref={rootRef} className="relative">
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{label}</div>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                aria-haspopup="listbox"
                className="w-full flex items-center justify-between gap-2 bg-black/40 border border-border rounded-md px-3 py-2 hover:border-primary/60 focus:border-primary outline-none transition-colors text-left"
            >
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                    {selected.length === 0 && (
                        <span className="text-sm text-muted/80">{placeholder}</span>
                    )}
                    {chips.map((v) => {
                        const opt = options.find((o) => o.value === v);
                        return (
                            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary text-xs max-w-[180px]">
                                <span className="truncate">{opt?.label ?? v}</span>
                                <span
                                    onClick={(e) => { e.stopPropagation(); toggle(v); }}
                                    className="opacity-70 hover:opacity-100 cursor-pointer"
                                >
                                    <X size={10} />
                                </span>
                            </span>
                        );
                    })}
                    {overflow > 0 && (
                        <span className="text-xs text-muted">+{overflow}</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {selected.length > 0 && (
                        <span onClick={clearAll} className="text-muted hover:text-white cursor-pointer" title="Clear">
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {open && (
                <div className="absolute top-full mt-1 left-0 right-0 z-40 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                    {searchable && (
                        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                            <Search size={13} className="text-muted" />
                            <input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search…"
                                aria-label="Search items"
                                className="bg-transparent outline-none text-sm text-white w-full placeholder:text-muted/60"
                                autoFocus
                            />
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto py-1">
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-center text-sm text-muted">{emptyLabel}</div>
                        )}
                        {filtered.map((o) => {
                            const active = selectedSet.has(o.value);
                            return (
                                <button
                                    key={o.value}
                                    type="button"
                                    onClick={() => toggle(o.value)}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm transition-colors ${active ? 'bg-white/5 text-white' : 'text-muted hover:bg-white/5 hover:text-white'}`}
                                >
                                    <span className={`w-4 h-4 inline-flex items-center justify-center rounded border ${active ? 'bg-primary border-primary text-black' : 'border-border'}`}>
                                        {active && <Check size={11} strokeWidth={3} />}
                                    </span>
                                    <span className="flex-1 truncate">{o.label}</span>
                                    {o.hint !== undefined && (
                                        <span className="text-xs text-subtle">{o.hint}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
