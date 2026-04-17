import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/shared/ui/Navbar';
import { ChainProvider } from '@/providers/ChainProvider';
import { SocketProvider } from '@/providers/SocketProvider';

export const metadata: Metadata = {
  title: 'ERC-8004 Agent Benchmarking',
  description: 'Trustless AI Agent TrustRank leaderboard powered by on-chain data and decay scoring',
  keywords: ['ERC-8004', 'AI agents', 'blockchain', 'TrustRank', 'DeFi', 'Base', 'Arbitrum'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-background text-white antialiased min-h-screen">
        <ChainProvider>
          <SocketProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-64px)] overflow-x-hidden pt-4 pb-12">
              {children}
            </main>
          </SocketProvider>
        </ChainProvider>
      </body>
    </html>
  );
}
