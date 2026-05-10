'use client';
import FeedbackTable from '@/features/agent-profile/components/FeedbackTable';

interface Props { chainId: number; agentId: string; }

// Thin wrapper so the Feedback tab mounts its own component tree
// (and thus triggers its own API call) when activated.
export default function FeedbackTab({ chainId, agentId }: Props) {
    return <FeedbackTable chainId={chainId} agentId={agentId} />;
}
