'use client';
import Link from 'next/link';
import { AgentProfile, resolveIPFS, explorerAddressUrl, formatScore, truncateAddress } from '@/shared/api/client';
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
              ? <Badge variant="success"><CheckCircle size={10} /> Active</Badge>
              : <Badge variant="danger"><XCircle size={10} /> Inactive</Badge>}
            {profile.hasOASF && <Badge variant="primary">OASF</Badge>}
            {profile.x402Support && <Badge variant="accent"><Zap size={10} /> x402</Badge>}
            {profile.supportedTrust?.map(t => <Badge key={t} variant="muted">{t}</Badge>)}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Shield size={13} color="var(--color-text-subtle)" />
            <Link
              href={`/wallet/${profile.owner}`}
              className="font-mono text-xs text-muted hover:text-primary transition-colors"
              title={profile.owner}
            >
              {truncateAddress(profile.owner, 10)}
            </Link>
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
          <span className="text-5xl font-heading font-bold text-primary leading-none">
            {formatScore(s.trustScore)}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted mt-2">TrustScore</span>
          <div className="score-bar-wrap w-full mt-3">
            <div className="score-bar-fill gold" style={{ width: `${(s.trustScore / 1000) * 100}%` }} />
          </div>
        </div>

      </div>
    </div>
  );
}
