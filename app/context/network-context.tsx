"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { networkOptions } from "@/app/lib/constants";
import Cookie from "js-cookie"

interface NetworkContextType {
  currentNetwork: NetworkOption | undefined;
  setCurrentNetwork: (network: NetworkOption) => void;
  networks: NetworkOption[];
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentNetwork, setCurrentNetwork] = useState<NetworkOption>();

  useEffect(()=>{
    if(currentNetwork?.name){
      Cookie.set("network",currentNetwork.name)
    }
  },[currentNetwork?.name])

  return (
    <NetworkContext.Provider
      value={{ currentNetwork, setCurrentNetwork, networks: networkOptions }}
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
