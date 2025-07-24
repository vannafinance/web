"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';
import {
  StellarWalletsKit,
  WalletNetwork,
  FreighterModule,
  AlbedoModule,
  LobstrModule,
  xBullModule,
  HotWalletModule,
  RabetModule,
  HanaModule,
  ISupportedWallet,
  ModuleInterface,
  ModuleType
} from '@creit.tech/stellar-wallets-kit';

class ComingSoonModule implements ModuleInterface {
  moduleType;
  productId;
  productName;
  productUrl;
  productIcon;

  private originalModule: ModuleInterface;

  constructor(module: ModuleInterface) { 
    this.originalModule = module;
    this.moduleType = module.moduleType;
    this.productId = module.productId;
    this.productName = module.productName;
    this.productUrl = module.productUrl;
    this.productIcon = module.productIcon;
  }

  async isAvailable(): Promise<boolean> {
    return false; // Always return false to indicate this module is not available
  }

  async getAddress(params?: { path?: string }) {
      return this.originalModule.getAddress(params);
  }

  async signTransaction(xdr: string, opts?: any) {
    return this.originalModule.signTransaction(xdr, opts);
  }

  async signAuthEntry(authEntry: string, opts?: any) {
    return this.originalModule.signAuthEntry(authEntry, opts);
  }

  async signMessage(message: string, opts?: any) {
    return this.originalModule.signMessage(message, opts);
  }

  async getNetwork() {
    return this.originalModule.getNetwork();
  }
}

interface StellarContextType {
  kit: StellarWalletsKit;
  publicKey: string;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

const kit = new StellarWalletsKit({
  network: WalletNetwork.PUBLIC, 
  modules: [
    new FreighterModule(),
    new ComingSoonModule(new AlbedoModule()),
    new ComingSoonModule(new xBullModule()),
    new ComingSoonModule(new HotWalletModule()),
    new ComingSoonModule(new RabetModule()),
    new ComingSoonModule(new LobstrModule()),
    new ComingSoonModule(new HanaModule()),
  ],
});

export const StellarProvider = ({ children }: { children: ReactNode }) => {
  const [publicKey, setPublicKey] = useState('');

  const connect = async () => {
    try {
      await kit.openModal({
        notAvailableText: 'soon',
        onWalletSelected: async (option: ISupportedWallet) => {
          try {
            if (option.id !== new FreighterModule().productId) {
              console.warn(`Wallet ${option.id} is not supported yet.`);
              return;
            }
            kit.setWallet(option.id);
            const { address } = await kit.getAddress();
            setPublicKey(address);
            console.log("Wallet connected, public key:", address);
          } catch (e) {
             console.error("Error setting wallet or getting public key:", e);
          }
        },
      });
    } catch (error) {
      console.error("Error opening wallet modal:", error);
    }
  };

  const disconnect = () => {
    setPublicKey('');
    console.log("Wallet disconnected.");
  };
  
  const value = { kit, publicKey, connect, disconnect };

  return (
    <StellarContext.Provider value={value}>
      {children}
    </StellarContext.Provider>
  );
};

export const useStellar = (): StellarContextType => {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error('useStellar must be used within a StellarProvider');
  }
  return context;
};