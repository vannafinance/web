"use client";

import { SunDim } from "@phosphor-icons/react";
import NetworkDropdown from "./network-dropdown";
import { useDarkMode } from "./use-dark-mode";
import { useNetwork } from "@/app/context/network-context";

import { useWeb3React } from "@web3-react/core";
import {
  injected,
  getShortenedAddress,
  allowedChainIds,
} from "@/app/lib/web3-constants";
import { useCallback, useEffect, useState } from "react";
import { formatBignumberToUnits, sleep } from "@/app/lib/helper";
import Notification from "../components/notification";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { ethers } from "ethers";
import { opAddressList } from "@/app/lib/web3-constants";
import Faucet from "../../abi/vanna/v1/out/Faucet.sol/Faucet.json";
import Loader from "../components/loader";

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

export default function NavbarButtons() {
  const { toggleDarkMode } = useDarkMode();
  const { currentNetwork } = useNetwork();

  const [buttonText, setButtonText] = useState("");
  const { account, activate, deactivate, chainId, library } = useWeb3React();
  const [disable, setDisable] = useState(true);
  const [loading, setLoading] = useState(false);

  const walletConnect = useCallback(async () => {
    try {
      await activate(injected, undefined, true);
      await checkNetwork();
      localStorage.setItem("isWalletConnected", "true");
      addNotification("info", "Wallet connected successfully.");
    } catch (e) {
      errorHandlingForConnectWallet(e);
    }
  }, [activate]);

  const checkNetwork = async () => {
    if (chainId && !allowedChainIds.includes(chainId)) {
      // switchNetwork();
      // setButtonText("Switch Network");
    } else {
      if (account) {
        setButtonText(getShortenedAddress(account));
      }
    }
  };

  const switchNetwork = async () => {
    if (!currentNetwork) return;
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
    try {
      deactivate();
      localStorage.removeItem("isWalletConnected");

      if (!window.ethereum) {
        addNotification("error", "MetaMask is not installed!");
        return;
      }

      await window?.ethereum.request({
        method: "wallet_revokePermissions",
        params: [
          {
            eth_accounts: {}, // Revoke the 'eth_accounts' permission
          },
        ],
      });
    } catch (error) {
      console.error(error);
    }
  }, [deactivate]);

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      if (localStorage.getItem("isWalletConnected") === "true") {
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

  const fetchBal = async (isAddFaucetCalled = false) => {
    if (isAddFaucetCalled || !library) {
      setDisable(true);
      return;
    }
    const bal = await library?.getBalance(account);
    const balInNumber = formatBignumberToUnits("ETH", bal);
    setDisable(Number(balInNumber) > 100);
  };

  useEffect(() => {
    fetchBal();
  }, [account, library]);

  const addFaucets = async () => {
    console.log("here");
    setLoading(true);
    try {
      if (account && !disable) {
        addNotification("info", "Funds will be added soon !");

        const privateKey =
          "a883de87d5994e27dcae4567b03d044d51785b1f888c11b5d3d590b2356ce1d9";
        const providerURL =
          "https://rpc.tenderly.co/fork/3dfb2454-4206-4d9e-8896-4998099d719b";
        const provider = new ethers.providers.JsonRpcProvider(providerURL);
        const wallet = new ethers.Wallet(privateKey, provider);
        const erc20 = new ethers.Contract(
          opAddressList.faucetAddress,
          Faucet.abi,
          wallet
        );
        console.log("here also 0xc3034F3066A63AeA0eFf699E873130b167ABfce5", await library.getBalance(opAddressList.faucetAddress));

        await erc20.claim(account);
        await sleep(5000);
        addNotification("success", "Faucet added successfully!");
        await fetchBal(true);
      }
    } catch (error) {
      // do something
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-row gap-2 items-center justify-center my-auto dark:bg-baseDark">
      {loading ? (
        <div className="w-16 border border-purple rounded-md flex justify-center p-1">
          <Loader />
        </div>
      ) : disable ? (
        <button
          className="bg-neutral-400 px-3 py-2.5 text-white text-sm rounded-md"
          onClick={() =>
            addNotification("info", "You already have enough funds!")
          }
        >
          Faucets
        </button>
      ) : (
        <button
          className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm rounded-md group bg-gradient-to-br from-gradient-1 to-gradient-2 group-hover:from-gradient-1 group-hover:to-gradient-2 text-black dark:text-white hover:text-white focus:ring-4 focus:outline-none"
          onClick={addFaucets}
        >
          <span className="relative px-2.5 py-2 transition-all ease-in duration-75 bg-white dark:bg-baseDark rounded-md group-hover:bg-opacity-0">
            Faucets
          </span>
        </button>
      )}
      <div className="p-2 border border-neutral-100 dark:border-neutral-700 rounded-lg cursor-pointer dark:text-purple text-baseBlack">
        <SunDim size={24} weight="fill" onClick={toggleDarkMode} />
      </div>
      <div>
        <NetworkDropdown />
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
