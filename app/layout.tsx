"use client";

import Navbar from "./ui/header/navbar";
import { publicSans } from "./ui/fonts";
import "./globals.css";
import { Web3Providers } from "./web3-providers";
import { NetworkProvider } from "./context/network-context";
import StoreProvider from "./store-provider";
import { DarkModeProvider } from "./ui/header/use-dark-mode";
import { PrivyProvider } from "@privy-io/react-auth";
import Providers from "../providers/PrivyProvider";



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.className} antialiased dark:bg-baseDark`}>
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}
