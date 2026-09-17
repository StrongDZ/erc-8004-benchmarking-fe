# erc-8004-benchmarking-fe

Next.js 14 frontend for the ERC-8004 benchmarking platform. Displays:

- Realtime event feed (streamed over WebSocket from `/api/v1/ws`).
- Overview stats (multi-chain).
- New agents strip.
- Multi-select filters (chain, services, OASF skills/domains, tags, x402).
- Agent table with Name / Chain / Service / Score / Feedback / Owner / Created.

## Environment

```bash
cp .env.example .env.local
```

| Var | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8080/api/v1` | REST base, must include `/api/v1`. |
| `NEXT_PUBLIC_WS_URL` | derived from API URL | WebSocket endpoint. Override for split domains / reverse proxies. |

## Scripts

```bash
npm run dev
npm run build
npm run lint
```

## Architecture notes

- `app/` — Next.js App Router pages: the leaderboard home, the rising-stars and wallet-ranking views, the agent profile (`agents/[chainId]/[id]`), the wallet profile (`wallet/[address]`), and the operational admin, indexer, and feedback-uri pages.
- `features/` — self-contained slices for leaderboard, agent-profile, wallet-profile, indexer, and an admin operator console, each owning its components and view logic.
- `shared/api/client.ts` — a single typed REST client that owns all interface definitions; feature components render but never call `fetch` directly.
- `providers/SocketProvider.tsx` — one auto-reconnecting WebSocket connection; components subscribe through a `useSocketEvent` hook or a ring-buffered `useRealtimeEvents` feed.
