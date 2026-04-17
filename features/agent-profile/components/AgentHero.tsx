'use client';
import { AgentProfile, resolveIPFS, explorerAddressUrl, formatScore, formatPercent, truncateAddress } from '@/shared/api/client';
import { ExternalLink, CheckCircle, XCircle, Shield, Zap, Globe } from 'lucide-react';
import { Badge } from '@/shared/ui/Badge';

interface Props { profile: AgentProfile; chainId: number; }

export default function AgentHero({ profile, chainId }: Props) {
  const s = profile.scoring;
  const scoreRing = (s.trustScore / 1000) * 360;

  return (
    <div className="card grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 p-6 md:p-8">
      {/* Left: Avatar + info */}
      <div className="flex gap-6 items-start">
        <div className="relative w-24 h-24 shrink-0">
          <img
            src={resolveIPFS(profile.image)}
            alt={profile.name}
            className="w-24 h-24 rounded-full border-2 border-border object-cover"
            onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.agentId}`; }}
          />
          <svg className="absolute inset-0 w-24 h-24 -rotate-0 pointer-events-none" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(45,63,85,0.8)" strokeWidth="4" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="#F59E0B" strokeWidth="4"
              strokeDasharray={`${(scoreRing / 360) * 276.5} 276.5`}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(245,158,11,0.7))' }}
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white break-words">
            {profile.name || `Agent #${profile.agentId}`}
          </h1>
          <div className="flex flex-wrap gap-2">
            {profile.active
              ? <Badge variant="success"><CheckCircle size={10} /> Active</Badge>
              : <Badge variant="danger"><XCircle size={10} /> Inactive</Badge>}
            {profile.hasOASF && <Badge variant="primary">OASF</Badge>}
            {profile.x402Support && <Badge variant="accent"><Zap size={10} /> x402</Badge>}
            {profile.supportedTrust?.map(t => <Badge key={t} variant="muted">{t}</Badge>)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield size={13} color="var(--color-text-subtle)" />
            <span className="font-mono text-xs">{truncateAddress(profile.owner, 10)}</span>
            <a href={explorerAddressUrl(chainId, profile.owner)} target="_blank" rel="noreferrer" className="text-muted hover:text-primary transition-colors">
              <ExternalLink size={12} />
            </a>
          </div>
          {profile.description && (
            <p className="text-muted text-sm leading-relaxed">{profile.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {profile.domains?.map(d => <Badge key={d} variant="accent">{d}</Badge>)}
            {profile.oasfSkills?.slice(0, 3).map(sk => (
              <Badge key={sk} variant="muted" style={{ fontSize: '0.65rem' }}>{sk.split('/').pop()}</Badge>
            ))}
          </div>

          {profile.offchainMetadata?.website && (
            <a
              href={profile.offchainMetadata.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-primary transition-colors"
            >
              <Globe size={13} /> {profile.offchainMetadata.website}
            </a>
          )}
        </div>
      </div>

      {/* Right: Scoring stats */}
      <div className="flex flex-col gap-4">
        <div className="card-glass p-4 flex flex-col items-start">
          <span className="text-5xl font-heading font-bold text-primary text-glow-primary leading-none">
            {formatScore(s.trustScore)}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted mt-2">TrustScore</span>
          <div className="score-bar-wrap w-full mt-3">
            <div className="score-bar-fill gold" style={{ width: `${(s.trustScore / 1000) * 100}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Total Tasks', value: s.totalTasks.toLocaleString(), color: 'text-white' },
            { label: 'Success Rate', value: formatPercent(s.successRate), color: 'text-success' },
            { label: 'Passed', value: s.totalPassed.toLocaleString(), color: 'text-white' },
            { label: 'Failed', value: s.totalFailed.toLocaleString(), color: 'text-danger' },
            { label: 'Cons. Fails', value: s.consecutiveFails, color: s.consecutiveFails > 0 ? 'text-danger' : 'text-success' },
            { label: 'Penalty', value: s.penalty.toFixed(1), color: 'text-accent' },
          ].map(item => (
            <div key={item.label} className="bg-black/40 border border-border rounded-md px-3 py-2 flex flex-col">
              <span className={`text-lg font-bold font-heading ${item.color}`}>{item.value}</span>
              <span className="text-[10px] uppercase tracking-wider text-subtle">{item.label}</span>
            </div>
          ))}
        </div>

        {s.classDistribution && Object.keys(s.classDistribution).length > 0 && (
          <div className="flex flex-col gap-1.5">
            {Object.entries(s.classDistribution).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-24 capitalize text-muted">{k.replace('_', ' ')}</span>
                <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${(v / Math.max(1, s.totalTasks)) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-muted tabular-nums">{v}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
