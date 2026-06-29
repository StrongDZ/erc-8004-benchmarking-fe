'use client';
import { AgentProfile, formatScore } from '@/shared/api/client';
import { AgentAvatar } from '@/shared/ui/AgentAvatar';
import { CheckCircle, XCircle, Shield, Zap, TrendingDown } from 'lucide-react';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { AddressLabel } from '@/shared/ui/AddressLabel';
import { Badge } from '@/shared/ui/Badge';
import { RegistrationBadge } from './RegistrationBadge';

interface Props { profile: AgentProfile; chainId: number; }

export default function AgentHero({ profile, chainId }: Props) {
  const s = profile.scoring;
  const scoreRing = (Math.min(100, s.trustScore) / 100) * 360;

  return (
    <div className="card grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 p-6 md:p-8">
      {/* Left: Avatar + info */}
      <div className="flex gap-6 items-start">
        <div className="relative w-24 h-24 shrink-0">
          <AgentAvatar
            image={profile.image}
            seed={profile.agentId}
            size={96}
            alt={profile.name}
            className="w-24 h-24 rounded-full border-2 border-border object-cover"
          />
          <svg className="absolute inset-0 w-24 h-24 -rotate-0 pointer-events-none" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="var(--color-border)" strokeWidth="4" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="var(--color-primary)" strokeWidth="4"
              strokeDasharray={`${(scoreRing / 360) * 276.5} 276.5`}
              strokeLinecap="round"
              transform="rotate(-90 48 48)"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-white break-words">
            {profile.name || `Agent #${profile.agentId}`}
          </h1>
          <div className="flex flex-wrap gap-2">
            <RegistrationBadge currentChainId={chainId} currentAgentId={profile.agentId} />
            {profile.active
              ? <Badge variant="success" size="sm"><CheckCircle size={10} /> Active</Badge>
              : <Badge variant="danger" size="sm"><XCircle size={10} /> Inactive</Badge>}
            {profile.hasOASF && <Badge variant="primary" size="sm">OASF</Badge>}
            {profile.x402Support && <Badge variant="accent" size="sm"><Zap size={10} /> x402</Badge>}
            {profile.supportedTrust?.map(t => <Badge key={t} variant="muted" size="sm">{t}</Badge>)}
          </div>
          {profile.owner && (
            <div className="flex items-center gap-2 text-sm text-muted min-w-0">
              <Shield size={13} color="var(--color-text-subtle)" className="shrink-0" />
              <AddressLabel
                address={profile.owner}
                chars={10}
                avatarSize={14}
                className="min-w-0 max-w-full font-mono text-xs text-muted hover:text-primary transition-colors truncate"
              />
            </div>
          )}
          {profile.description && (
            <p className="text-muted text-sm leading-relaxed">{profile.description}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {profile.domains?.map(d => <Badge key={d} variant="accent" size="sm">{d}</Badge>)}
            {profile.oasfSkills?.slice(0, 3).map(sk => (
              <Badge key={sk} variant="muted" size="xs">{sk.split('/').pop()}</Badge>
            ))}
          </div>

          {profile.offchainMetadata?.website && (
            <LinkOutbound
              href={profile.offchainMetadata.website}
              external
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-primary transition-colors break-all"
            >
              {profile.offchainMetadata.website}
            </LinkOutbound>
          )}
        </div>
      </div>

      {/* Right: Scoring stats */}
      <div className="flex flex-col gap-4">
        <div className="card-glass p-4 flex flex-col items-start">
          <span className="text-5xl font-heading font-bold text-primary leading-none">
            {formatScore(s.trustScore)}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted mt-2">
            TrustScore <span className="text-subtle">/100</span>
          </span>
          <div className="score-bar-wrap w-full mt-3">
            <div className="score-bar-fill gold" style={{ width: `${Math.min(100, s.trustScore)}%` }} />
          </div>
          {s.penalty > 0 && (
            <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-danger/40 bg-danger/15 px-2.5 py-1 text-2xs font-semibold text-danger">
              <TrendingDown size={11} /> -{s.penalty.toFixed(1)}% reliability penalty
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
