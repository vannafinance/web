"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { networkOptions } from "@/app/lib/constants";
import Cookie from "js-cookie";
import { switchNetwork } from "@/app/lib/wallet-utils"; // Import the utility

// Define the interface for a network option
interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
}

interface NetworkContextType {
  currentNetwork: NetworkOption | undefined;
  handleSetCurrentNetwork: (network: NetworkOption) => void; 
  networks: NetworkOption[];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkOption>();

  
  const handleSetCurrentNetwork = useCallback(async (network: NetworkOption) => {
    await switchNetwork(network.id);
    setCurrentNetwork(network); 
  }, []);

  useEffect(() => {
    if (currentNetwork?.name) {
      Cookie.set("network", currentNetwork.name);
    }
  }, [currentNetwork?.name]);

  return (
    <NetworkContext.Provider
      value={{ currentNetwork, handleSetCurrentNetwork, networks: networkOptions }}
    >
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};