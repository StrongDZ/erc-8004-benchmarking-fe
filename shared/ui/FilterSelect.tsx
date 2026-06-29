'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useFloatingPanel } from '@/shared/ui/useFloatingPanel';

export interface FilterSelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface FilterSelectProps {
  label: string;
  value: string;
  options: FilterSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  searchable?: boolean;
  className?: string;
  emptyLabel?: string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Any',
  searchable = false,
  className = '',
  emptyLabel = 'No options',
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelRect = useFloatingPanel(open, triggerRef);

  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [options, value],
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  const resetValue = options[0]?.value ?? 'all';
  const showClear = value !== resetValue;

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <div className="text-3xs font-semibold text-subtle uppercase tracking-wider mb-1.5">
        {label}
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between gap-2 bg-black/40 border border-border rounded-lg px-3 py-2 hover:border-primary/50 focus:border-primary outline-none transition-colors text-left"
      >
        <span
          className={`text-sm truncate ${selected ? 'text-white' : 'text-muted/80'}`}
          title={selected?.description ?? selected?.label}
        >
          {selected?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {showClear && selected && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                pick(resetValue);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(resetValue);
                }
              }}
              className="text-muted hover:text-white cursor-pointer p-0.5"
              title="Clear"
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {open && panelRect && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[100] bg-elevated border border-border rounded-xl shadow-2xl overflow-hidden"
          style={{
            top: panelRect.top,
            left: panelRect.left,
            width: Math.max(panelRect.width, 260),
          }}
        >
          {searchable && (
            <div className="px-3 py-2 border-b border-border bg-black/20">
              <div className="flex items-center gap-2 bg-black/40 border border-border rounded-md px-2 py-1.5 focus-within:border-primary transition-colors">
                <Search size={13} className="text-muted shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search…"
                  aria-label={`Search ${label}`}
                  className="bg-transparent border-none outline-none text-white w-full placeholder:text-muted/60 text-sm"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="text-muted hover:text-white"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-sm text-muted text-center">{emptyLabel}</div>
            ) : (
              filtered.map((o) => {
                const active = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(o.value)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      active ? 'bg-primary/12 hover:bg-primary/16' : 'hover:bg-white/5'
                    }`}
                  >
                    <Check
                      size={14}
                      className={`shrink-0 mt-0.5 transition-opacity ${
                        active ? 'text-primary opacity-100' : 'opacity-0'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm truncate ${
                          active ? 'text-primary font-medium' : 'text-white/90'
                        }`}
                      >
                        {o.label}
                      </span>
                      {o.description && (
                        <span className="block text-2xs text-muted truncate mt-0.5 font-mono">
                          {o.description}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
