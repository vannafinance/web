'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { base, arbitrum, optimism } from 'viem/chains';
import { defineChain } from 'viem';

const APP_ID = process.env.NEXT_PUBLIC_APP_ID
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID

// Define Katana chain since it's not in viem/chains
const katana = defineChain({
  id: 747474,
  name: 'Katana',
  network: 'katana',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH'
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.katana.network']
    }
  },
  blockExplorers: {
    default: { name: 'Katana Explorer', url: 'https://explorer.katanarpc.com/' }
  }
});

export default function Providers({ children }: { children: React.ReactNode }) {
  if (!APP_ID) { return null }
  return (
    <PrivyProvider
      appId={APP_ID}
      clientId={CLIENT_ID}
      config={{
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        defaultChain: base,
        supportedChains: [base, arbitrum, optimism, katana]
      }}
    >
      {children}
    </PrivyProvider>
  );
}