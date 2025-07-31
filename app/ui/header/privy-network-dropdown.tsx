"use client";

import {
  usePrivy,
  useWallets,
  getEmbeddedConnectedWallet,
} from "@privy-io/react-auth";
import { CaretDown} from "@phosphor-icons/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useNetwork } from "@/app/context/network-context";

export const PrivyNetworkDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { setCurrentNetwork, networks } = useNetwork();
  const [selectedNetwork, setSelectedNetwork] = useState(networks[0]);
  const { authenticated} = usePrivy();
  const { wallets } = useWallets();

  // Get the primary connected wallet (handle both external and embedded wallets)
  const getPrimaryConnectedWallet = () => {
    if (wallets && wallets.length > 0) {
      // First try to find an external ethereum wallet
      const externalWallet = wallets.find(
        (wallet) => wallet.type === "ethereum" && !wallet.walletClientType
      );
      if (externalWallet) {
        return { wallet: externalWallet, type: "external" };
      }

      // If no external wallet, try embedded wallet
      const embeddedWallet = getEmbeddedConnectedWallet(wallets);
      if (embeddedWallet) {
        return { wallet: embeddedWallet, type: "embedded" };
      }

      // Fallback to first wallet
      return {
        wallet: wallets[0],
        type: wallets[0].walletClientType ? "embedded" : "external",
      };
    }
    return null;
  };

  const primaryWalletInfo = getPrimaryConnectedWallet();
  const primaryWallet = primaryWalletInfo?.wallet;
  const walletType = primaryWalletInfo?.type;

  const handleNetworkSwitch = async (network: (typeof networks)[0]) => {
    try {
      if (!primaryWallet) {
        console.warn("No primary wallet available");
        return;
      }

      if (walletType === "embedded") {
        // For embedded wallets, use Privy's switchChain method
        console.log("Using embedded wallet network switching");
        try {
          await primaryWallet.switchChain(parseInt(network.chainId, 16));
          console.log("Successfully switched embedded wallet to network");
          setSelectedNetwork(network);
          setCurrentNetwork(network);
        } catch (switchError: any) {
          console.error(
            "Error switching embedded wallet network:",
            switchError
          );
        }
      } else {
        // For external wallets (like MetaMask), use RPC methods
        console.log("Using external wallet network switching");
        if (primaryWallet.type === "ethereum") {
          const provider = await primaryWallet.getEthereumProvider();

          try {
            // First try to switch to the chain
            await provider.request({
              method: "wallet_switchEthereumChain",
              params: [{ chainId: network.chainId }],
            });
            console.log("Successfully switched external wallet to network");
            setSelectedNetwork(network);
            setCurrentNetwork(network);
          } catch (switchError: any) {
            console.log("Switch error:", switchError);
            // If the chain doesn't exist, add it first
            if (switchError.code === 4902) {
              console.log(
                "Chain not found, adding chain to external wallet..."
              );
              try {
                const chainConfig = {
                  chainId: network.chainId,
                  chainName: network.name,
                  nativeCurrency: {
                    name: network.name,
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: [network.rpcUrl || ""],
                  blockExplorerUrls: network.blockExplorerUrl
                    ? [network.blockExplorerUrl]
                    : [],
                };

                console.log("Adding chain with config:", chainConfig);

                // Add the chain to the wallet
                await provider.request({
                  method: "wallet_addEthereumChain",
                  params: [chainConfig],
                });

                console.log("Chain added successfully, now switching...");

                // Now try to switch to the newly added chain
                await provider.request({
                  method: "wallet_switchEthereumChain",
                  params: [{ chainId: network.chainId }],
                });

                console.log("Successfully switched to newly added network");
                setSelectedNetwork(network);
                setCurrentNetwork(network);
              } catch (addError: any) {
                console.error("Error adding chain:", addError);
                console.error("Add error details:", {
                  message: addError.message,
                  code: addError.code,
                  stack: addError.stack,
                });
              }
            } else {
              console.error("Error switching network:", switchError);
              console.error("Switch error details:", {
                message: switchError.message,
                code: switchError.code,
                stack: switchError.stack,
              });
            }
          }
        } else {
          console.warn(
            "Primary wallet is not ethereum type:",
            primaryWallet.type
          );
        }
      }
    } catch (error: any) {
      console.error("Error in network switching:", error);
      console.error("Main error details:", {
        message: error.message,
        stack: error.stack,
      });
    }
    setIsOpen(false);
  };

  // Update selected network based on current wallet chain
  useEffect(() => {
    if (primaryWallet && primaryWallet.chainId) {
      const currentChainId = parseInt(primaryWallet.chainId, 16); // chainId is in hex format
      const matchingNetwork = networks.find(
        (network) => parseInt(network.chainId, 16) === currentChainId
      );
      if (matchingNetwork) {
        setSelectedNetwork(matchingNetwork);
        setCurrentNetwork(matchingNetwork);
      }
    }
  }, [primaryWallet, networks, setCurrentNetwork]);


  if (!authenticated || !primaryWallet) {
    return null;
  }

  return (
    <div className="relative inline-block text-left text-baseBlack dark:text-baseWhite">
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

      {isOpen && (
        <div className="bg-white dark:bg-baseDark origin-top-right absolute left-0 mt-2 w-40 rounded-md shadow-xl ring-1 ring-black dark:ring-neutral-800 ring-opacity-5">
          <div className="py-1">
            {networks.map((network) => (
              <button
                key={network.id}
                className="flex items-center p-3 text-sm w-full rounded-lg hover:bg-neutral-100 dark:hover:bg-baseDarkComplementary dark:bg-baseDark"
                role="menuitem"
                onClick={() => handleNetworkSwitch(network)}
              >
                <Image
                  src={network.icon}
                  width="20"
                  height="20"
                  alt={network.name}
                />
                &nbsp;&nbsp;{network.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivyNetworkDropdown;
