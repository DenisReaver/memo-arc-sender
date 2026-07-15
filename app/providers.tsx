'use client';

import { WagmiProvider, createConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import { injected, walletConnect } from 'wagmi/connectors';
import { arcTestnet } from './chains';

const queryClient = new QueryClient();

const config = createConfig({
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http('https://rpc.testnet.arc.network'),
  },
  connectors: [
    // MetaMask / Injected (для ПК)
    injected({
      shimDisconnect: true,
    }),
    // WalletConnect (для мобильных + QR код)
    walletConnect({
      projectId: 'da13e8b76983976be4b39ecba29072bd', // ← Замени на свой Project ID
      showQrModal: true,
    }),
  ],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
