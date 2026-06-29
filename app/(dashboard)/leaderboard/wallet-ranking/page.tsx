import { Suspense } from 'react';
import WalletRankingTablePage from '@/features/leaderboard/components/WalletRankingTablePage';

export default function WalletRankingPage() {
    return (
        <Suspense
            fallback={
                <div className="container mx-auto max-w-[1200px] px-4 py-16 text-center text-muted">
                    Loading wallet ranking…
                </div>
            }
        >
            <WalletRankingTablePage />
        </Suspense>
    );
}
