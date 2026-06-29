'use client';
import FeedbackFeed from '@/features/agent-profile/components/FeedbackFeed';
import FeedbackClientsSidebar from '@/features/agent-profile/components/FeedbackClientsSidebar';

interface Props {
    chainId: number;
    agentId: string;
    initialServiceEndpoint?: string;
    onServiceFilterChange?: (endpoint: string) => void;
}

export default function FeedbackTab({
    chainId,
    agentId,
    initialServiceEndpoint,
    onServiceFilterChange,
}: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
            <div className="min-w-0 order-2 lg:order-1">
                <FeedbackFeed
                    chainId={chainId}
                    agentId={agentId}
                    initialServiceEndpoint={initialServiceEndpoint}
                    onServiceFilterChange={onServiceFilterChange}
                />
            </div>
            <div className="min-w-0 order-1 lg:order-2">
                <FeedbackClientsSidebar chainId={chainId} agentId={agentId} />
            </div>
        </div>
    );
}
