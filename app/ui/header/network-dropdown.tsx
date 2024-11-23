"use client";

import { useNetwork } from "@/app/context/network-context";
import { sleep } from "@/app/lib/helper";
import { poolsPlaceholder } from "@/app/lib/static-values";
import { setPoolsData } from "@/app/store/pools-slice";
import { CaretDown } from "@phosphor-icons/react";
import { useWeb3React } from "@web3-react/core";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export const NetworkDropdown = () => {
  const { currentNetwork, setCurrentNetwork, networks } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState(currentNetwork);
  const { library, account, chainId } = useWeb3React();
  const dispatch = useDispatch();

  const switchNetwork = async (network: NetworkOption) => {
    try {
      await library?.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: network.chainId }],
      });
      await sleep(1500);
      dispatch(setPoolsData(poolsPlaceholder));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (networkSwitchError: any) {
      if (networkSwitchError.code === 4902) {
        try {
          await library?.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: network.chainId,
                chainName: network.name,
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.blockExplorerUrl],
              },
            ],
          });
        } catch (chainAddError) {
          console.error("Error adding network:", chainAddError);
        }
      } else {
        console.error("Error switching networks:", networkSwitchError);
        return;
      }
    }

    setSelectedNetwork(network);
    setCurrentNetwork(network);
  };

  const networkCheck = () => {
    if (account) {
      if (chainId === 8453) {
        setSelectedNetwork(networks[0]);
        setCurrentNetwork(networks[0]);
      } else if (chainId === 42161) {
        setSelectedNetwork(networks[1]);
        setCurrentNetwork(networks[1]);
      } else if (chainId === 10) {
        setSelectedNetwork(networks[2]);
        setCurrentNetwork(networks[2]);
      } else {
        switchNetwork(networks[0]);
      }
    }

    setIsOpen(false);
  };

  useEffect(() => {
    networkCheck();
  }, []);

  useEffect(() => {
    networkCheck();
  }, [account, chainId]);

  const handleSelect = (network: NetworkOption) => {
    if (network !== selectedNetwork) {
      if (account && library) {
        switchNetwork(network);
      } else {
        console.error("Please connect wallet first!");
      }
    }
    setIsOpen(false);
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
            <Image
              src={selectedNetwork ? selectedNetwork.icon : networks[0].icon}
              width="20"
              height="20"
              alt={selectedNetwork ? selectedNetwork.name : networks[0].name}
            />
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
            <Image
              src={selectedNetwork ? selectedNetwork.icon : networks[0].icon}
              width="20"
              height="20"
              alt={selectedNetwork ? selectedNetwork.name : networks[0].name}
            />
            &nbsp;&nbsp;
            <CaretDown weight="bold" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="bg-white dark:bg-baseDark origin-top-right absolute left-0 mt-2 w-40 rounded-md shadow-xl ring-1 ring-black dark:ring-neutral-800 ring-opacity-5">
          <div
            className="p-1"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="options-menu"
          >
            {networks.map((option) => (
              <button
                key={option.id}
                className="flex items-center p-3 text-sm w-full rounded-lg hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary dark:bg-baseDark"
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
