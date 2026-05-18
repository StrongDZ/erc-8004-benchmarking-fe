import type { FeedbackClassification } from '@/shared/lib/feedbackClassification';

export interface ScoreBreakdown {
    reputation: number;  // [0, 100]
    services: number;    // [0, 100]
    publisher: number;   // [0, 100]
    compliance: number;  // [0, 100]
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: { page: number; limit: number; total: number };
    error?: { code: string; message: string };
    requestId?: string;
}

/** GET /offchain-by-uri — Mongo `offchain_data` row for a logical URI. */
export interface OffchainByUriData {
    found: boolean;
    status?: number;
    sourceType?: string;
    eventType?: string;
    contractType?: string;
    fetchError?: string;
    contentSize?: number;
    parsed?: unknown;
    rawPreview?: string;
}

export interface ChainCore {
    chainId: number;
    agentCount: number;
}

export interface AgentService {
    name: string;
    endpoint?: string;
    version?: string;
    skills?: string[];
    domains?: string[];
}

export interface LeaderboardAgent {
    rank: number;
    chainId: number;
    agentId: string;
    name: string;
    image: string;
    owner: string;
    /** Composite trust score in range [0, 100]. */
    trustScore: number;
    scoreBreakdown: ScoreBreakdown;
    reputationScore: number;
    scoreUpdateAt: number;
    consecutiveFails: number;
    totalTasks: number;
    totalPassed: number;
    totalFailed: number;
    successRate: number;
    active: boolean;
    x402Support: boolean;
    hasOASF: boolean;
    domains: string[];
    oasfSkills: string[];
    oasfDomains: string[];
    services?: AgentService[];
    tags?: string[];
    createdAt?: number;
}

export interface LeaderboardStats {
    chainId: number;
    chainIds?: number[];
    totalAgents: number;
    activeAgents: number;
    totalFeedbacks: number;
    avgTrustScore: number;
    medianTrustScore: number;
    top10ScoreAvg: number;
    lastBlockIndexed: number;
    lastIndexedAt: string;
}

export interface TagCount {
    tag: string;
    count: number;
}

export interface RisingStar {
    chainId: number;
    agentId: string;
    name: string;
    image?: string;
    scoreNow: number;
    scoreBefore: number;
    delta: number;
    velocity: number;
    period: string;
}

export interface AgentProfile {
    chainId: number;
    agentId: string;
    owner: string;
    agentURI: string;
    name: string;
    description: string;
    image: string;
    active: boolean;
    x402Support: boolean;
    supportedTrust: string[];
    domains: string[];
    hasOASF: boolean;
    oasfSkills: string[];
    oasfDomains: string[];
    scoring: {
        /** Composite trust score in range [0, 100]. */
        trustScore: number;
        scoreBreakdown: ScoreBreakdown;
        reputationScore: number;
        scoreUpdateAt: number;
        consecutiveFails: number;
        penalty: number;
        totalTasks: number;
        totalPassed: number;
        totalFailed: number;
        successRate: number;
        classDistribution: Record<string, number>;
    };
    createdAt: string;
    offchainMetadata?: Record<string, string>;
}

export interface OnchainMetadataValue {
    rawHex?: string;
    decoded?: unknown;
    detectedType?: string;
    confidence?: string;
}

export interface ServiceOverview {
    name: string;
    endpoint?: string;
    version?: string;
    skills?: string[];
    domains?: string[];
    health: 'ok' | 'warning' | 'fail' | 'unknown';
    healthInfo?: string;
}

export interface AgentOverview {
    chainId: number;
    agentId: string;
    owner?: string;
    agentURI?: string;
    name?: string;
    description?: string;
    image?: string;
    active: boolean;
    createdAt?: string;
    createdTx?: string;
    agentWallet?: string;
    services: ServiceOverview[];
    onchainMetadata?: Record<string, OnchainMetadataValue>;
    offchainMetadata?: Record<string, unknown>;
}

export interface ScorePoint {
    timestamp: string;
    score: number;
    type: 'event' | 'decay';
    txHash?: string;
}

export interface RadarData {
    successRate: number;
    taskVolume: number;
    avgDifficulty: number;
    scoreVelocity: number;
    domainDepth: number;
    consistency: number;
}

export interface HeatmapDay {
    date: string;
    count: number;
    passed: number;
    failed: number;
}

export interface Feedback {
    _id: string;
    feedbackIndex: number;
    clientAddress: string;
    value: string;
    valueDecimals: number;
    unit?: string;
    vi: number;
    wi: number;
    priceUSDC: number;
    tag1: string;
    tag2?: string;
    endpoint?: string;
    txHash: string;
    blockNumber: number;
    timestamp: string;
    /** Unix seconds when the feedback event occurred (preferred for sorting/math). */
    timestampUnix?: number;
    revokeTxHash: string | null;
    feedbackURI?: string;
    /** Scale detected by the backend for this (tag1, tag2) pair: binary | star5 | star10 | pct100 | unbounded | "" */
    valueScale?: string;
    classification?: FeedbackClassification;
    responses?: Array<{ responder: string; responseURI: string; txHash: string }>;
}

export interface Penalty {
    feedbackIndex: number;
    clientAddress: string;
    timestamp: string;
    vi: number;
    wi: number;
    penaltyApplied: number;
    reason: 'fail' | 'revoked';
    txHash: string;
    revokeTxHash: string | null;
}

export interface IdentityEvent {
    eventName: string;
    agentURI: string;
    owner: string;
    blockNumber: number;
    txHash: string;
    timestamp: string;
}

export interface OASFFacet {
    key: string;
    name?: string;
    label?: string;
    count: number;
    parentKey?: string;
    children?: OASFFacet[];
}

export interface OASFFacetTree {
    allSkillsCount: number;
    allDomainsCount: number;
    skillNodes: OASFFacet[];
    domainNodes: OASFFacet[];
}

export interface IndexerChainStatus {
    chainId: number;
    lastProcessedBlock: number;
    agentCount: number;
    feedbackCount: number;
    identityRegistry?: string;
    reputationRegistry?: string;
    lastIndexedAt?: string;
}

export interface IndexerWorkerStatus {
    running: boolean;
    cursor?: {
        blockNumber: number;
        logIndex: number;
    };
}

export interface IndexerStatusResponse {
    chains: IndexerChainStatus[];
    workers: Record<string, IndexerWorkerStatus>;
    events24h: number;
    feedbacks24h: number;
}

export interface ProofData {
    chainId: number;
    txHash: string;
    blockNumber: number;
    eventName: string;
    contractType: string;
    args: Record<string, unknown>;
    feedbackURI?: string;
    responseURIs?: string[];
}

export interface LeaderboardQuery {
    chainIds?: number[];
    skills?: string[];
    domains?: string[];
    services?: string[];
    tags?: string[];
    x402?: boolean;
    hasOASF?: boolean;
    active?: boolean;
    minScore?: number;
    minTasks?: number;
    query?: string;
    sort?: 'score_desc' | 'score_asc' | 'tasks_desc' | 'recent';
    page?: number;
    limit?: number;
    owner?: string;
}

export interface WalletFeedback extends Feedback {
    agentId: string;
    chainId: number;
    agentName?: string;
}

export type { FeedbackClassification } from '@/shared/lib/feedbackClassification';
