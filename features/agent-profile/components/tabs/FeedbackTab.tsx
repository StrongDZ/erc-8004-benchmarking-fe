'use client';
import FeedbackFeed from '@/features/agent-profile/components/FeedbackFeed';

interface Props { chainId: number; agentId: string; }

export default function FeedbackTab({ chainId, agentId }: Props) {
    return <FeedbackFeed chainId={chainId} agentId={agentId} />;
}
