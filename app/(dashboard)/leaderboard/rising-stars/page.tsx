import { Suspense } from 'react';
import RisingStarsTablePage from '@/features/leaderboard/components/RisingStarsTablePage';

export default function RisingStarsLeaderboardPage() {
    return (
        <Suspense
            fallback={
                <div className="container mx-auto max-w-[1200px] px-4 py-16 text-center text-muted">
                    Loading rising stars…
                </div>
            }
        >
            <RisingStarsTablePage />
        </Suspense>
    );
}
