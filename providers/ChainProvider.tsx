'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, Chain, enrichChain } from '@/shared/api/client';
import { DEFAULT_CHAIN_ID } from '@/shared/constants/app';

interface ChainCtx {
  chains: Chain[];
  chainId: number;
  setChainId: (id: number) => void;
}

const ChainContext = createContext<ChainCtx>({ chains: [], chainId: DEFAULT_CHAIN_ID, setChainId: () => {} });

export function ChainProvider({ children }: { children: React.ReactNode }) {
  const [chains, setChains] = useState<Chain[]>([]);
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);

  useEffect(() => {
    api.chains().then((r) => {
      if (r.success && r.data?.length) {
        setChains(r.data.map(enrichChain));
      }
    });
  }, []);

  return <ChainContext.Provider value={{ chains, chainId, setChainId }}>{children}</ChainContext.Provider>;
}

export function useChain() { return useContext(ChainContext); }
