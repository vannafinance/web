"use client";

import { SunDim } from "@phosphor-icons/react";
import NetworkDropdown from "./network-dropdown";
import useDarkMode from "./use-dark-mode";
import { useNetwork } from "@/app/context/network-context";

import { useWeb3React } from "@web3-react/core";
import { injected, getShortenedAddress, allowedChainIds } from "@/app/lib/web3-constants";
import { useCallback, useEffect, useState } from "react";
import { sleep } from "@/app/lib/helper";
import Notification from "../components/notification";

export default function NavbarButtons() {
  const { toggleDarkMode } = useDarkMode();
  const { currentNetwork, setCurrentNetwork, networks } = useNetwork();

  const [buttonText, setButtonText] = useState("");
  const { account, activate, deactivate, chainId, library } = useWeb3React();

  const walletConnect = useCallback(async () => {
    try {
      await activate(injected, undefined, true);
      await checkNetwork();
      localStorage?.setItem("isWalletConnected", "true");
      addNotification("info", "Wallet connected successfully.");
    } catch (e) {
      errorHandlingForConnectWallet(e);
    }
  }, [activate]);

  const checkNetwork = async () => {
    if (chainId && !allowedChainIds.includes(chainId)) {
      switchNetwork();
      // setButtonText("Switch Network");
    } else {
      if (account) {
        setButtonText(getShortenedAddress(account));
      }
    }
  };

  const switchNetwork = async () => {
    try {
      await library?.provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: currentNetwork.chainId }],
      });
      await sleep(3000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await library?.provider.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: currentNetwork.chainId,
                chainName: "vanna (" + currentNetwork.name + ")",
                nativeCurrency: {
                  name: "Ether",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [currentNetwork.rpcUrl],
                blockExplorerUrls: [currentNetwork.blockExplorerUrl],
              },
            ],
          });
        } catch (err) {
          console.error("Error adding arb Test Network:", err);
        }
      } else {
        console.error("Error switching networks:", switchError);
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorHandlingForConnectWallet = (err: any) => {
    let errMsg = null;
    console.error(err.name);
    if (
      err.name === "NoEthereumProviderError" ||
      err.message?.includes("No Ethereum provider was found")
    ) {
      errMsg = "No MetaMask detected.";
    } else if (
      err.message.includes("Already processing eth_requestAccounts") ||
      err.message.includes(`Request of type 'wallet_requestPermissions'`)
    ) {
      errMsg = "Check MetaMask for an existing login request";
    } else if (err.message.includes("The user rejected the request")) {
      errMsg = "The MetaMask login was closed, try connecting again";
    } else if (err.name === "UnsupportedChainIdError") {
      checkNetwork();
      return;
    } else {
      errMsg = err.message ?? "Something went wrong logging in";
      console.error(err);
    }
    addNotification("error", errMsg);
  };

  const walletButtonClick = () => {
    if (buttonText === "Switch Network") {
      switchNetwork();
    } else {
      wallectDisconnect();
    }
  };

  const wallectDisconnect = useCallback(async () => {
    deactivate();
    localStorage?.removeItem("isWalletConnected");
  }, [deactivate]);

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      if (localStorage?.getItem("isWalletConnected") === "true") {
        try {
          await activate(injected, undefined, true);
          await sleep(3000);
        } catch (e) {
          errorHandlingForConnectWallet(e);
        }
      }
    };
    connectWalletOnPageLoad();
  }, []);

  useEffect(() => {
    checkNetwork();
  }, [library]);

  const [notifications, setNotifications] = useState<
    Array<{ id: number; type: NotificationType; message: string }>
  >([]);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  };

  return (
    <div className="flex flex-row gap-2 items-center justify-center my-auto dark:bg-baseDark">
      <div className="p-2 border border-neutral-100 dark:border-neutral-700 rounded-lg cursor-pointer dark:text-purple text-baseBlack">
        <SunDim size={24} weight="fill" onClick={toggleDarkMode} />
      </div>
      <div>
        <NetworkDropdown options={networks} onSelect={setCurrentNetwork} />
      </div>
      {!account && (
        <button
          className="bg-gradient-to-r from-gradient-1 to-gradient-2 w-40 h-11 text-baseWhite rounded-lg text-base font-semibold"
          onClick={() => {
            walletConnect();
          }}
        >
          Connect Wallet
        </button>
      )}
      {account && (
        <button
          className="bg-gradient-to-r from-gradient-1 to-gradient-2 w-40 h-11 text-baseWhite rounded-lg text-base font-semibold"
          onClick={() => {
            walletButtonClick();
          }}
        >
          {buttonText}
        </button>
      )}

      <div className="fixed bottom-5 left-5 w-72">
        {notifications.map(({ id, type, message }) => (
          <Notification
            key={id}
            type={type}
            message={message}
            onClose={() => removeNotification(id)}
            duration={3000}
          />
        ))}
      </div>
    </div>
  );
}
