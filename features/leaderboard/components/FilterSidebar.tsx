'use client';
import { useEffect, useState } from 'react';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';
import { api, OASFFacet } from '@/shared/api/client';

interface Props {
  chainId: number;
  selectedSkills: string[];
  selectedDomains: string[];
  onSkillToggle: (skill: string) => void;
  onDomainToggle: (domain: string) => void;
  onClear: () => void;
}

function FacetNode({ facet, level, selectedDomains, selectedSkills, onToggle, type }: {
  facet: OASFFacet; level: number;
  selectedDomains: string[]; selectedSkills: string[];
  onToggle: (key: string) => void; type: 'skill' | 'domain';
}) {
  const [open, setOpen] = useState(level < 1);
  const selected = type === 'skill' ? selectedSkills.includes(facet.key) : selectedDomains.includes(facet.key);
  const hasChildren = (facet.children ?? []).length > 0;

  return (
    <div className="flex flex-col">
      <div className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-white/5 transition-colors cursor-pointer ${selected ? "bg-white/5" : ''}`} style={{ paddingLeft: 8 + level * 16 }}>
        {hasChildren ? (
          <button className="text-muted hover:text-white transition-colors" onClick={() => setOpen(v => !v)}>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-3.5 inline-block" />
        )}
        <label className="flex items-center gap-2 flex-1 cursor-pointer">
          <input type="checkbox" checked={selected} onChange={() => onToggle(facet.key)} className="accent-primary w-3.5 h-3.5 rounded border-border" />
          <span className={`text-sm flex-1 truncate ${selected ? 'text-primary font-medium' : 'text-muted hover:text-white'}`}>{facet.label || facet.key.split('/').pop()}</span>
          <span className="text-xs text-subtle bg-black/40 px-1.5 py-0.5 rounded">{facet.count}</span>
        </label>
      </div>
      {open && hasChildren && (
        <div className="mt-1 flex flex-col gap-1">
          {(facet.children ?? []).map(c => (
            <FacetNode key={c.key} facet={c} level={level + 1} selectedDomains={selectedDomains} selectedSkills={selectedSkills} onToggle={onToggle} type={type} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterSidebar({ chainId, selectedSkills, selectedDomains, onSkillToggle, onDomainToggle, onClear }: Props) {
  const [facets, setFacets] = useState<OASFFacet[]>([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState<'domains' | 'skills'>('domains');
  const total = selectedSkills.length + selectedDomains.length;

  useEffect(() => {
    api.oasfFacets(chainId).then(r => {
      if (r.success) setFacets(r.data ?? []);
      setLoading(false);
    });
  }, [chainId]);

  const validFacets = Array.isArray(facets) ? facets : [];
  const domainFacets = validFacets.filter(f => f.key.startsWith('domain'));
  const skillFacets = validFacets.filter(f => !f.key.startsWith('domain'));

  return (
    <aside className="w-full lg:w-[280px] flex-shrink-0 bg-background/50 border border-border rounded-xl p-4 sticky top-[88px] max-h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2 font-bold text-white text-[1.1rem]">
          <Filter size={15} /> Filters
        </div>
        {total > 0 && (
          <button className="flex items-center gap-1.5 text-danger text-xs hover:text-red-400 font-medium transition-colors" onClick={onClear}>
            <X size={13} /> Clear ({total})
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-black/40 p-1 rounded-lg mb-4">
        <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${section === 'domains' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`} onClick={() => setSection('domains')}>Domains</button>
        <button className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${section === 'skills' ? 'bg-primary text-black' : 'text-muted hover:text-white'}`} onClick={() => setSection('skills')}>Skills</button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="animate-pulse bg-white/10 rounded-md h-8" />)}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {section === 'domains' && (domainFacets.length > 0 ? domainFacets : validFacets).map(f => (
            <FacetNode key={f.key} facet={f} level={0} selectedDomains={selectedDomains} selectedSkills={selectedSkills} onToggle={onDomainToggle} type="domain" />
          ))}
          {section === 'skills' && skillFacets.map(f => (
            <FacetNode key={f.key} facet={f} level={0} selectedDomains={selectedDomains} selectedSkills={selectedSkills} onToggle={onSkillToggle} type="skill" />
          ))}
          {validFacets.length === 0 && <p className="text-sm text-muted text-center py-4">No filters available</p>}
        </div>
      )}
    </aside>
  );
}
