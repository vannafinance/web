"use client";

import Navbar from "./ui/header/navbar";
import { publicSans } from "./ui/fonts";
import "./globals.css";
import { Web3Providers } from "./web3-providers";
import { NetworkProvider } from "./context/network-context";
import StoreProvider from "./store-provider";
import { DarkModeProvider } from "./ui/header/use-dark-mode";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "./lib/wagmi";

const queryClient = new QueryClient();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.className} antialiased dark:bg-baseDark`}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <StoreProvider>
              <NetworkProvider>
                <Web3Providers>
                  <DarkModeProvider>
                    <Navbar />
                    {children}
                  </DarkModeProvider>
                </Web3Providers>
              </NetworkProvider>
            </StoreProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
