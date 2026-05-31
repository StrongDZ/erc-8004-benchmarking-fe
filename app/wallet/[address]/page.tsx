'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { api, LeaderboardAgent, WalletProfile } from '@/shared/api/client';
import { useChain } from '@/providers/ChainProvider';
import WalletHero from '@/features/wallet-profile/components/WalletHero';
import OwnedAgentsSection from '@/features/wallet-profile/components/OwnedAgentsSection';
import FeedbackGivenSection from '@/features/wallet-profile/components/FeedbackGivenSection';

export default function WalletPage({ params }: { params: { address: string } }) {
    const { address } = params;
    const { chains } = useChain();

    const [ownedAgents, setOwnedAgents] = useState<LeaderboardAgent[]>([]);
    const [ownedLoading, setOwnedLoading] = useState(true);
    const [feedbackTotal, setFeedbackTotal] = useState(0);
    const [walletProfile, setWalletProfile] = useState<WalletProfile | null>(null);

    useEffect(() => {
        setOwnedLoading(true);
        api.ownedAgents(address)
            .then(r => {
                if (r.success) setOwnedAgents(r.data ?? []);
                else setOwnedAgents([]);
            })
            .catch(() => setOwnedAgents([]))
            .finally(() => setOwnedLoading(false));
    }, [address]);

    useEffect(() => {
        api.walletProfile(address)
            .then(r => { if (r.success) setWalletProfile(r.data ?? null); })
            .catch(() => {});
    }, [address]);

    // Derive chainId for block explorer link from first owned agent (fallback to mainnet)
    const primaryChainId = ownedAgents[0]?.chainId ?? walletProfile?.chainId ?? 1;

    return (
        <div className="container fade-in" style={{ padding: '32px 0 64px' }}>
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

            <div className="flex flex-col gap-6">
                <WalletHero
                    address={address}
                    chainId={primaryChainId}
                    ownedCount={ownedAgents.length}
                    ownedLoading={ownedLoading}
                    feedbackCount={feedbackTotal}
                    interactedCount={0}
                    trustScore={walletProfile?.trustScore}
                    trustScorePropagated={walletProfile?.trustScorePropagated}
                />
                <OwnedAgentsSection
                    agents={ownedAgents}
                    chains={chains}
                    loading={ownedLoading}
                    walletAddress={address}
                />
                <FeedbackGivenSection address={address} chains={chains} onTotalChange={setFeedbackTotal} />
            </div>
        </div>
    );
}
