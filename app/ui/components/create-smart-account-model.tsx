"use client";

import React, { useState } from "react";
import { X } from "@phosphor-icons/react";
import { Contract } from "ethers";
import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import AccountManagerop from "../../abi/vanna/v1/out/AccountManager-op.sol/AccountManager-op.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import { useWeb3React } from "@web3-react/core";
import { sleep } from "@/app/lib/helper";
import {
  arbAddressList,
  baseAddressList,
  opAddressList,
} from "@/app/lib/web3-constants";
import Loader from "./loader";
import {
  ARBITRUM_NETWORK,
  BASE_NETWORK,
  OPTIMISM_NETWORK,
} from "@/app/lib/constants";
import { useNetwork } from "@/app/context/network-context";

const CreateSmartAccountModal: React.FC<CreateSmartAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreateAccount = async () => {
    if (!currentNetwork) return;
    setLoading(true);
    try {
      const signer = await library?.getSigner();

      let accountManagerContract;
      let regitstryContract;
      if (currentNetwork.id === ARBITRUM_NETWORK) {
        regitstryContract = new Contract(
          arbAddressList.registryContractAddress,
          Registry.abi,
          signer
        );
        accountManagerContract = new Contract(
          arbAddressList.accountManagerContractAddress,
          AccountManager.abi,
          signer
        );
      } else if (currentNetwork.id === OPTIMISM_NETWORK) {
        regitstryContract = new Contract(
          opAddressList.registryContractAddress,
          Registry.abi,
          signer
        );
        accountManagerContract = new Contract(
          opAddressList.accountManagerContractAddress,
          AccountManagerop.abi,
          signer
        );
      } else if (currentNetwork.id === BASE_NETWORK) {
        regitstryContract = new Contract(
          baseAddressList.registryContractAddress,
          Registry.abi,
          signer
        );
        accountManagerContract = new Contract(
          baseAddressList.accountManagerContractAddress,
          AccountManager.abi,
          signer
        );
      }
      if (regitstryContract && accountManagerContract) {
        const accountsArray = await regitstryContract.accountsOwnedBy(account);
        if (accountsArray.length === 0) {
          await accountManagerContract.openAccount(account, {
            gasLimit: 2300000,
          });
          await sleep(7000);
        } else {
          console.error("Margin account already present");
        }
      }
    } catch (e) {
      console.error(e);
    }
    await sleep(10000);
    setLoading(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-baseDark p-5 rounded-2xl shadow-xl max-w-[90%] xs:max-w-sm w-full text-baseBlack dark:text-baseWhite text-base font-semibold"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2.5 mb-5 border-b border-b-neutral-500">
          <h2>Create Margin Account</h2>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700"
          >
            <X size={20} />
          </button>
        </div>

        <ol className="list-decimal list-inside mb-5">
          <li className="mb-3">
            Connect your wallet{" "}
            <span className="text-neutral-400 font-normal">to get started</span>
          </li>
          <li className="mb-3">
            <span className="text-neutral-400 font-normal">
              Confirm your Margin Account -{" "}
            </span>
            we&apos;ll generate a unique address for you.
          </li>
          <li className="mb-3">
            Make a deposit{" "}
            <span className="text-neutral-400 font-normal">
              to activate borrowing
            </span>
          </li>
        </ol>

        {loading && (
          <button className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-baseWhite py-3 rounded-md text-lg flex justify-center">
            <Loader />
          </button>
        )}
        {!loading && (
          <button
            onClick={handleCreateAccount}
            className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-baseWhite py-3 rounded-md text-lg"
          >
            Create Margin Account
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateSmartAccountModal;
