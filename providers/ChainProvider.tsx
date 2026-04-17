'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, Chain } from '@/shared/api/client';

interface ChainCtx {
  chains: Chain[];
  chainId: number;
  setChainId: (id: number) => void;
}

const ChainContext = createContext<ChainCtx>({ chains: [], chainId: 8453, setChainId: () => {} });

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [chainId, setChainId] = useState(8453);

  useEffect(() => {
    api.chains().then(r => { if (r.success && r.data?.length) setChains(r.data); });
  }, []);

  return <ChainContext.Provider value={{ chains, chainId, setChainId }}>{children}</ChainContext.Provider>;
}

export function useChain() { return useContext(ChainContext); }
