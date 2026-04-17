'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { api, AgentProfile, HeatmapDay, RadarData, ScorePoint } from '@/shared/api/client';
import AgentHero from '@/features/agent-profile/components/AgentHero';
import TrustScoreChart from '@/features/agent-profile/components/TrustScoreChart';
import SkillRadarChart from '@/features/agent-profile/components/SkillRadarChart';
import ActivityHeatmap from '@/features/agent-profile/components/ActivityHeatmap';
import FeedbackTable from '@/features/agent-profile/components/FeedbackTable';

export default function AgentProfilePage({ params }: { params: { chainId: string; id: string } }) {
  const chainId = parseInt(params.chainId);
  const agentId = params.id;

  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [history, setHistory] = useState<ScorePoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [radar, setRadar] = useState<RadarData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.agentProfile(chainId, agentId).then(r => setProfile(r.data ?? null)),
      api.scoreHistory(chainId, agentId, '1d').then(r => setHistory(r.data?.points ?? [])),
      api.activityHeatmap(chainId, agentId).then(r => setHeatmap(r.data ?? [])),
      api.radar(chainId, agentId).then(r => setRadar(r.data ?? null)),
    ]).finally(() => setLoading(false));
  }, [chainId, agentId]);

  if (loading) {
    return (
      <div className="container fade-in" style={{ padding: '40px 0' }}>
        <Skeleton style={{ height: 260, borderRadius: 24, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '24px' }}>
          <Skeleton style={{ height: 320, borderRadius: 16 }} />
          <Skeleton style={{ height: 320, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container fade-in" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Agent Not Found</h2>
        <p style={{ color: 'var(--color-text-muted)' }}>Could not load data for agent {agentId} on chain {chainId}.</p>
        <Button variant="outline" style={{ marginTop: '24px', display: 'inline-flex' }} onClick={() => window.location.href = '/'}>
          <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Leaderboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ padding: '32px 0 64px' }}>
      {/* Breadcrumb nav */}
      <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-muted)', textDecoration: 'none', marginBottom: 24, fontSize: '0.85rem' }}>
        <ArrowLeft size={14} /> Back to Leaderboard
      </Link>

      {/* Hero Section */}
      <div style={{ marginBottom: 24 }}>
        <AgentHero profile={profile} chainId={chainId} />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24 }}>
          <TrustScoreChart points={history} />
          <SkillRadarChart data={radar} />
        </div>
      </div>

      {/* Heatmap Row */}
      <div style={{ marginBottom: 24 }}>
        <ActivityHeatmap data={heatmap} />
      </div>

      {/* Feedback Table */}
      <div>
        <FeedbackTable chainId={chainId} agentId={agentId} />
      </div>
    </div>
  );
}
