"use client";

import Navbar from "./ui/header/navbar";
import { publicSans } from "./ui/fonts";
import "./globals.css";
import { Web3Providers } from "./web3-providers";
import { NetworkProvider } from "./context/network-context";
import StoreProvider from "./store-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${publicSans.className} antialiased`}>
        <StoreProvider>
          <NetworkProvider>
            <Web3Providers>
              <Navbar />
              {children}
            </Web3Providers>
          </NetworkProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
