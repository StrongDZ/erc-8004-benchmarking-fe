'use client';
import Link from 'next/link';
import { AgentProfile, resolveIPFS, truncateAddress } from '@/shared/api/client';
import { CheckCircle, XCircle, Shield, Zap } from 'lucide-react';
import { LinkOutbound } from '@/shared/ui/LinkOutbound';
import { Badge } from '@/shared/ui/Badge';
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel';

interface Props { profile: AgentProfile; chainId: number; }

export default function AgentHero({ profile, chainId: _chainId }: Props) {
  const s = profile.scoring;
  const scoreRing = (Math.min(100, s.trustScore) / 100) * 360;

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
            {profile.active
              ? <Badge variant="success" size="sm"><CheckCircle size={10} /> Active</Badge>
              : <Badge variant="danger" size="sm"><XCircle size={10} /> Inactive</Badge>}
            {profile.hasOASF && <Badge variant="primary" size="sm">OASF</Badge>}
            {profile.x402Support && <Badge variant="accent" size="sm"><Zap size={10} /> x402</Badge>}
            {profile.supportedTrust?.map(t => <Badge key={t} variant="muted" size="sm">{t}</Badge>)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted min-w-0">
            <Shield size={13} color="var(--color-text-subtle)" className="shrink-0" />
            <Link
              href={`/wallet/${profile.owner}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1 font-mono text-xs text-muted hover:text-primary transition-colors truncate"
              title={profile.owner}
            >
              {truncateAddress(profile.owner, 10)}
            </Link>
          </div>
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

      {/* Right: Trust score + breakdown receipt */}
      <ScoreBreakdownPanel
        breakdown={s.scoreBreakdown}
        compositeScore={s.trustScore}
        variant="hero"
      />
    </div>
  );
}
