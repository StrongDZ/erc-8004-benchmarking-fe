"use client";
// shared/ui/OASFDetailSelect.tsx
// Rich multi-select popup for OASF skills / domains. Each row shows the
// caption, key, description and agent count. Tree depth is shown via left
// padding. Depth-0 category roots already include the group caption and
// description, so a separate group header is unnecessary. Filterable via search.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { OASFEntry } from "@/shared/api/oasf-schema";

export interface OASFDetailSelectProps {
    label: string;
    placeholder?: string;
    entries: OASFEntry[];
    counts: Record<string, number>;
    selected: string[];
    loading?: boolean;
    onChange: (next: string[]) => void;
}

export function OASFDetailSelect({ label, placeholder = "Any", entries, counts, selected, loading = false, onChange }: OASFDetailSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const rootRef = useRef<HTMLDivElement>(null);
    const selectedSet = useMemo(() => new Set(selected), [selected]);

    useEffect(() => {
        function onDown(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    // Fuzzy-ish filter: match caption, description, category, or full key.
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(
            (e) =>
                e.caption.toLowerCase().includes(q) ||
                e.description.toLowerCase().includes(q) ||
                e.categoryName.toLowerCase().includes(q) ||
                e.key.toLowerCase().includes(q),
        );
    }, [entries, search]);

    // Flat list: sort by category, then by key (roots sort before their children).
    const displayRows = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const ca = a.categoryName || a.category || "";
            const cb = b.categoryName || b.category || "";
            if (ca !== cb) return ca.localeCompare(cb);
            return a.key.localeCompare(b.key);
        });
    }, [filtered]);

    const captionByKey = useMemo(() => {
        const m = new Map<string, string>();
        for (const e of entries) m.set(e.key, e.caption);
        return m;
    }, [entries]);

    function toggle(key: string) {
        if (selectedSet.has(key)) onChange(selected.filter((k) => k !== key));
        else onChange([...selected, key]);
    }

    // Show at most 2 chips on the trigger to keep the bar tidy.
    const chips = selected.slice(0, 2);
    const overflow = selected.length - chips.length;

    return (
        <div ref={rootRef} className="relative">
            <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{label}</div>

            {/* Trigger */}
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="w-full flex items-center justify-between gap-2 bg-black/40 border border-border rounded-md px-3 py-2 hover:border-primary/60 focus:border-primary outline-none transition-colors text-left"
            >
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                    {selected.length === 0 && <span className="text-sm text-muted/80">{placeholder}</span>}
                    {chips.map((key) => (
                        <span
                            key={key}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/15 border border-primary/30 text-primary text-xs max-w-[160px]"
                        >
                            <span className="truncate">{captionByKey.get(key) ?? key.split("/").pop()}</span>
                            <span
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggle(key);
                                }}
                                className="opacity-70 hover:opacity-100 cursor-pointer"
                            >
                                <X size={10} />
                            </span>
                        </span>
                    ))}
                    {overflow > 0 && <span className="text-xs text-muted">+{overflow}</span>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                    {selected.length > 0 && (
                        <span
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([]);
                            }}
                            className="text-muted hover:text-white cursor-pointer"
                            title="Clear"
                        >
                            <X size={14} />
                        </span>
                    )}
                    <ChevronDown size={14} className={`text-muted transition-transform ${open ? "rotate-180" : ""}`} />
                </div>
            </button>

            {/* Popup */}
            {open && (
                <div className="absolute top-full mt-1 left-0 z-50 w-[480px] max-w-[calc(100vw-32px)] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                    {/* Search */}
                    <div className="px-3 py-2 border-b border-border bg-black/20">
                        <div className="flex items-center gap-2 bg-black/40 border border-border rounded-md px-2 py-1.5 focus-within:border-primary transition-colors">
                            <Search size={13} className="text-muted flex-shrink-0" />
                            <input
                                autoFocus
                                className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted/60 text-sm"
                                placeholder="Search caption, description, or category…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            {search && (
                                <button type="button" onClick={() => setSearch("")} className="text-muted hover:text-white" aria-label="Clear search">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
                        {loading ? (
                            <div className="px-4 py-8 text-sm text-muted text-center">Loading…</div>
                        ) : displayRows.length === 0 ? (
                            <div className="px-4 py-8 text-sm text-muted text-center">
                                {entries.length === 0 ? "No options available" : "No matches"}
                            </div>
                        ) : (
                            displayRows.map((e, i) => {
                                const isSelected = selectedSet.has(e.key);
                                const count = counts[e.key] ?? 0;
                                const indentPx = e.depth * 14;
                                const isRoot = e.depth === 0;
                                const g = e.categoryName || e.category || "Other";
                                const prevG = i > 0 ? displayRows[i - 1]!.categoryName || displayRows[i - 1]!.category || "Other" : "";
                                const isGroupStart = i > 0 && g !== prevG;
                                const rowBg = isRoot
                                    ? isSelected
                                        ? "bg-primary/16 hover:bg-primary/20"
                                        : "bg-primary/8 hover:bg-primary/12"
                                    : isSelected
                                      ? "bg-primary/10 hover:bg-primary/15"
                                      : "hover:bg-white/5";
                                return (
                                    <div
                                        key={e.key}
                                        onClick={() => toggle(e.key)}
                                        className={[
                                            "flex items-start gap-3 px-3 cursor-pointer transition-colors select-none",
                                            isGroupStart ? "border-t border-white/10" : "",
                                            isRoot ? "py-3" : "py-2.5",
                                            rowBg,
                                        ].join(" ")}
                                        style={{ paddingLeft: `${12 + indentPx}px` }}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div
                                                className={`truncate ${isRoot ? "text-[15px] font-bold" : "text-sm font-semibold"} ${
                                                    isSelected ? "text-primary" : isRoot ? "text-white" : "text-white/90"
                                                }`}
                                            >
                                                {e.caption}
                                            </div>
                                            <div className="text-[12px] text-subtle mt-0.5 truncate font-mono">{e.key}</div>
                                            {e.description && (
                                                <div className="text-xs text-muted mt-0.5 line-clamp-2 leading-relaxed">{e.description}</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
                                            <span
                                                className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded ${
                                                    count > 0 ? "text-white/80 bg-white/5" : "text-subtle"
                                                }`}
                                                title={`${count} agent${count === 1 ? "" : "s"}`}
                                            >
                                                {count}
                                            </span>
                                            <Check
                                                size={14}
                                                className={`transition-opacity ${isSelected ? "text-primary opacity-100" : "opacity-0"}`}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    {selected.length > 0 && (
                        <div className="border-t border-border px-3 py-2 flex items-center justify-between bg-black/20">
                            <span className="text-xs text-muted">{selected.length} selected</span>
                            <button type="button" onClick={() => onChange([])} className="text-xs text-danger hover:text-red-400 transition-colors">
                                Clear all
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
