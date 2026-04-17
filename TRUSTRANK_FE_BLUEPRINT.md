# Frontend Architecture (AI-TrustRank)

## Phần 8: Frontend Architecture

### 8.1 Directory Structure (Feature-Sliced Design)

```
frontend/
├── app/                                    # Next.js 14 App Router
│   ├── (dashboard)/
│   │   ├── page.tsx                        # Route: / (Dashboard/Leaderboard)
│   │   ├── loading.tsx                     # Skeleton — hiển thị khi page đang fetch
│   │   ├── error.tsx                       # Error Boundary — ErrorFallback component
│   │   └── layout.tsx                      # Dashboard layout (sidebar, header)
│   ├── agents/
│   │   └── [id]/
│   │       ├── page.tsx                    # Route: /agents/:id (Agent Profile)
│   │       └── loading.tsx
│   ├── admin/
│   │   └── page.tsx                        # Route: /admin (Admin/Simulator Dashboard)
│   ├── layout.tsx                          # Root layout: QueryProvider + ThemeProvider
│   └── globals.css
│
├── features/                               # FSD: Feature modules — 1 folder/feature
│   ├── leaderboard/
│   │   ├── components/
│   │   │   ├── DataGrid.tsx                # Server-side sort/paginate table (Phần 8.3)
│   │   │   ├── CategoryFilter.tsx          # Bộ lọc category (Zustand state)
│   │   │   └── RisingStarBadge.tsx         # Badge cho is_rising_star = true
│   │   ├── hooks/
│   │   │   ├── useLeaderboard.ts           # React Query → GET /leaderboard
│   │   │   └── useSSEUpdates.ts            # Consume SSE → patch React Query cache
│   │   └── store/
│   │       └── filterStore.ts              # Zustand: category, page, limit (Phần 8.2)
│   │
│   ├── agent-profile/
│   │   ├── components/
│   │   │   ├── AgentCard.tsx               # Header card (Phần 8.3)
│   │   │   ├── TrustScoreChart.tsx         # Recharts LineChart — history endpoint
│   │   │   ├── SkillRadarChart.tsx         # Recharts RadarChart — multi-dim skills
│   │   │   ├── ActivityHeatmap.tsx         # Heatmap — task frequency calendar
│   │   │   └── PenaltyLog.tsx              # Table — penalties endpoint
│   │   └── hooks/
│   │       └── useAgentProfile.ts          # React Query → GET /agents/:id
│   │
│   └── admin/
│       └── components/
│           ├── IndexerStatus.tsx           # Polling /health, hiển thị sync status
│           └── SimulatorPanel.tsx          # Trigger mock agent/task creation
│
├── shared/                                 # FSD: Shared layer
│   ├── ui/                                 # shadcn/ui wrappers + custom primitives
│   │   ├── ScoreBadge.tsx                  # Hiển thị score với color coding
│   │   ├── StatusIndicator.tsx             # Live/Disconnected dot indicator
│   │   ├── DataGridSkeleton.tsx            # Skeleton (Phần 8.4)
│   │   └── ErrorFallback.tsx               # Error UI (Phần 8.4)
│   ├── api/
│   │   └── client.ts                       # Fetch wrapper: base URL, error handling
│   ├── hooks/
│   │   └── useSSE.ts                       # Generic SSE hook với reconnect logic
│   └── lib/
│       ├── formatters.ts                   # score→string, date→display, delta→color
│       └── constants.ts                    # API_BASE_URL, CATEGORIES enum, SSE_URL
│
└── providers/
    ├── QueryProvider.tsx                   # TanStack Query v5 Provider
    └── ThemeProvider.tsx                   # Dark theme provider
```
