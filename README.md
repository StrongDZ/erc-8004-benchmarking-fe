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

- `providers/SocketProvider.tsx` owns a single `SocketClient` instance (auto-reconnect
  + heartbeat); components subscribe via `useSocketEvent(type, handler)` or
  `useRealtimeEvents()` for the ring-buffered decoded event feed.
- `shared/api/client.ts` exposes `api.leaderboardQuery(...)` for multi-select
  filters and `api.tags(...)` for the tag autocomplete.
