'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { api, AgentProfile } from '@/shared/api/client';
import AgentHero from '@/features/agent-profile/components/AgentHero';
import OverviewTab from '@/features/agent-profile/components/tabs/OverviewTab';
import ServicesTab from '@/features/agent-profile/components/tabs/ServicesTab';
import StatisticsTab from '@/features/agent-profile/components/tabs/StatisticsTab';
import FeedbackTab from '@/features/agent-profile/components/tabs/FeedbackTab';

type TabKey = 'overview' | 'services' | 'statistics' | 'feedback';

const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'overview', label: 'Overview' },
    { key: 'services', label: 'Services' },
    { key: 'statistics', label: 'Statistics' },
    { key: 'feedback', label: 'Feedback' },
];

export default function AgentProfilePage({ params }: { params: { chainId: string; id: string } }) {
    const chainId = parseInt(params.chainId);
    const agentId = params.id;

    const [profile, setProfile] = useState<AgentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<TabKey>('overview');
    const [feedbackService, setFeedbackService] = useState<string>('all');

    const syncUrl = useCallback((nextTab: TabKey, service?: string) => {
        const url = new URL(window.location.href);
        if (nextTab === 'overview') {
            url.searchParams.delete('tab');
            url.searchParams.delete('service');
        } else {
            url.searchParams.set('tab', nextTab);
            if (nextTab === 'feedback' && service && service !== 'all') {
                url.searchParams.set('service', service);
            } else {
                url.searchParams.delete('service');
            }
        }
        window.history.replaceState({}, '', url);
    }, []);

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const urlTab = sp.get('tab') as TabKey | null;
        if (urlTab && TABS.some((t) => t.key === urlTab)) {
            setTab(urlTab);
        }
        const urlService = sp.get('service');
        if (urlService) {
            setFeedbackService(urlService);
        }
    }, []);

    const handleTabChange = (next: TabKey) => {
        setTab(next);
        if (next !== 'feedback') {
            setFeedbackService('all');
            syncUrl(next);
        } else {
            syncUrl(next, feedbackService);
        }
    };

    const goToFeedbackForService = (endpoint: string) => {
        setFeedbackService(endpoint);
        setTab('feedback');
        syncUrl('feedback', endpoint);
    };

    const handleFeedbackServiceChange = (endpoint: string) => {
        setFeedbackService(endpoint);
        syncUrl('feedback', endpoint);
    };

    useEffect(() => {
        setLoading(true);
        api.agentProfile(chainId, agentId)
            .then(r => setProfile(r.data ?? null))
            .finally(() => setLoading(false));
    }, [chainId, agentId]);

    if (loading) {
        return (
            <div className="container fade-in" style={{ padding: '40px 0' }}>
                <Skeleton style={{ height: 260, borderRadius: 24, marginBottom: 24 }} />
                <Skeleton style={{ height: 48, borderRadius: 12, marginBottom: 24 }} />
                <Skeleton style={{ height: 320, borderRadius: 16 }} />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="container fade-in" style={{ padding: '60px 0', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Agent Not Found</h2>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Could not load data for agent {agentId} on chain {chainId}.
                </p>
                <Button variant="outline" style={{ marginTop: '24px', display: 'inline-flex' }} onClick={() => window.location.href = '/'}>
                    <ArrowLeft size={16} style={{ marginRight: 6 }} /> Back to Leaderboard
                </Button>
            </div>
        );
    }

    return (
        <div className="container fade-in" style={{ padding: '32px 0 64px' }}>
            {/* Breadcrumb nav */}
            <Link
                href="/"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: 'var(--color-text-muted)',
                    textDecoration: 'none',
                    marginBottom: 24,
                    fontSize: '0.85rem',
                }}
            >
                <ArrowLeft size={14} /> Back to Leaderboard
            </Link>

            {/* Hero */}
            <div style={{ marginBottom: 20 }}>
                <AgentHero profile={profile} chainId={chainId} />
            </div>

            {/* Tab navigation */}
            <div className="flex justify-start mb-6 overflow-x-auto">
                <div className="tabs">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            className={`tab-btn ${tab === t.key ? 'active' : ''}`}
                            onClick={() => handleTabChange(t.key)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab content — each tab owns its own data fetching */}
            {tab === 'overview' && <OverviewTab chainId={chainId} agentId={agentId} />}
            {tab === 'services' && (
                <ServicesTab
                    chainId={chainId}
                    agentId={agentId}
                    profile={profile}
                    onViewServiceFeedback={goToFeedbackForService}
                />
            )}
            {tab === 'statistics' && <StatisticsTab chainId={chainId} agentId={agentId} />}
            {tab === 'feedback' && (
                <FeedbackTab
                    chainId={chainId}
                    agentId={agentId}
                    initialServiceEndpoint={feedbackService}
                    onServiceFilterChange={handleFeedbackServiceChange}
                />
            )}
        </div>
    );
}
