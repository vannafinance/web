"use client";

import { useNetwork } from "@/app/context/network-context";
import { networkOptions } from "@/app/lib/constants";
import { sleep } from "@/app/lib/helper";
import { poolsPlaceholder } from "@/app/lib/static-values";
import { setPoolsData } from "@/app/store/pools-slice";
import { CaretDown } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

interface NetworkOption {
  id: string;
  name: string;
  icon: string;
  chainId: string;
  rpcUrl: string;
  blockExplorerUrl: string;
}

export const NetworkDropdown = () => {
  const { currentNetwork, handleSetCurrentNetwork, networks } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(currentNetwork);
  const { account, chainId } = useWeb3React();
  const dispatch = useDispatch();

  // This effect synchronizes the dropdown's selected network with the global context
  useEffect(() => {
    setSelectedNetwork(currentNetwork);
  }, [currentNetwork]);

  // This effect sets the initial network based on the wallet's connected chain
  useEffect(() => {
    const networkCheck = () => {
      if (account && chainId) {
        const connectedNetwork = networks.find(n => parseInt(n.chainId, 16) === chainId);
        if (connectedNetwork) {
          setSelectedNetwork(connectedNetwork);
          // No need to call handleSetCurrentNetwork here, as it would trigger a wallet prompt
        } else {
          // If wallet is on an unsupported network, default to the first option visually
          // and prompt them to switch.
          handleSetCurrentNetwork(networks[0]);
        }
      }
    };
    networkCheck();
  }, [account, chainId, networks, handleSetCurrentNetwork]);


  const handleSelect = async (network: NetworkOption) => {
    setIsOpen(false);
    if (network.id !== selectedNetwork?.id) {
      if (account) {
        // Use the globally defined function to switch networks and update state
        await handleSetCurrentNetwork(network);
        dispatch(setPoolsData(poolsPlaceholder));
      } else {
        console.error("Please connect your wallet first!");
      }
    }
  };

  return (
    <div className="relative inline-block text-left text-baseBlack dark:text-baseWhite">
      <div>
        {account ? (
          <button
            type="button"
            className="inline-flex items-center justify-center w-full border border-neutral-100 dark:border-neutral-700 rounded-lg py-2 px-3"
            onClick={() => setIsOpen(!isOpen)}
          >
            {selectedNetwork?.icon && (
              <Image
                src={selectedNetwork.icon}
                width="20"
                height="20"
                alt={selectedNetwork.name}
              />
            )}
            &nbsp;&nbsp;
            <CaretDown weight="bold" />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center opacity-50 justify-center w-full border border-neutral-100 dark:border-neutral-700 rounded-lg py-2 px-3 cursor-not-allowed"
            disabled
            title="Please Connect Wallet"
          >
            {networkOptions[0].icon && (
               <Image
                  src={networkOptions[0].icon}
                  width="20"
                  height="20"
                  alt={networkOptions[0].name}
               />
            )}
            &nbsp;&nbsp;
            <CaretDown weight="bold" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white dark:bg-baseDark origin-top-right absolute left-0 mt-2 w-48 rounded-md shadow-xl ring-1 ring-black dark:ring-neutral-800 ring-opacity-5">
          <div
            className="p-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {networks.map((option) => (
              <button
                key={option.id}
                className="flex items-center p-3 text-sm w-full rounded-lg hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary"
                role="menuitem"
                onClick={() => handleSelect(option)}
              >
                <Image
                  src={option.icon}
                  width="20"
                  height="20"
                  alt={option.name}
                />
                &nbsp;&nbsp;{option.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkDropdown;