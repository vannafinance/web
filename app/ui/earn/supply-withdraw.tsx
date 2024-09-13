/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from "react";
// caretdown imported to create custom dropdown, check if needed
import { CaretDown, Info } from "@phosphor-icons/react";
import clsx from "clsx";
import { networkOptions } from "@/app/lib/constants";
import NetworkDropdown from "../header/network-dropdown";
import Tooltip from "../components/tooltip";
import Image from "next/image";

import { BASE_NETWORK } from "@/app/lib/constants"; 
import { ethers, utils , Contract} from "ethers";
import { formatUnits, parseUnits } from "ethers/lib/utils";

import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json"
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json"
import { addressList } from "@/app/lib/web3-constants";


import DefaultRateModel from "../../abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import Multicall from "../../abi/vanna/v1/out/Multicall.sol/Multicall.json";
import { ceilWithPrecision6, ceilWithPrecision } from "@/app/lib/helper";

const SupplyWithdraw: React.FC<SupplyWithdrawProps> = ({
  balance,
  currentAPY,
}) => {
  const [isSupply, setIsSupply] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );

  while(1){
    //VToken 
    //+"v" + pool.name 
    //YouGet
    // amount * ethperveth
    //token per vtoken
    // const ethPerVeth = formatBignumberToUnits(
    //   token,
    //   await vEtherContract.convertToShares(parseUnits("1", 18))
    // );

    // Current APY
    // pool.supplyAPY
    

  }

    // if(action) {

    //   const contract = new Contract(
    //    addressList.vEtherContractAddress, 
    //    VEther.abi, 
    //   signer
    // );

    //   const vBTCtokenContract = new Contract(
    //     addressList.vWBTCContractAddress,
    //     VToken.abi,
    //     signer
    //   );

    //   const vUSDCtokenContract = new Contract(
    //     addressList.vUSDCContractAddress,
    //     VToken.abi,
    //     signer
    //   );

    //   const vUSDTtokenContract = new Contract(
    //     addressList.vUSDTContractAddress,
    //     VToken.abi,
    //     signer
    //   );
    //   const vDAItokenContract = new Contract(
    //   addressList.vDaiContractAddress, 
    //   VToken.abi,
    //   signer
    // );


    /// ERC20 contract 
    //   const WBTCContract = new Contract(tokensAddress[token], ERC20.abi, signer);
    //   const USDCContract = new Contract(tokensAddress[token], ERC20.abi, signer);
    //   const USDTContract = new Contract(tokensAddress[token], ERC20.abi, signer);
    //   const DAIContract = new Contract(tokensAddress[token], ERC20.abi, signer);


    //if (token === "WETH") {
    //   await contract.depositEth({ value: parseEther(amount), gasLimit: 2300000 });
    // } else if (token === "WBTC") {
    //   // to confirm this abi, address & function


    //   const allowance = await WBTCContract.allowance(account, addressList.vWBTCContractAddress);

    //   if (allowance < amount) {
    //     await WBTCContract.approve(addressList.vWBTCContractAddress, parseEther(amount));
    //     await sleep(3000);
    //   }

    //   await vBTCtokenContract.deposit(parseEther(amount), account, { gasLimit: 2300000 });
    // } else if (token === "USDC") {
    //   // to confirm this abi, address & function

    //   const allowance = await USDCContract.allowance(account, addressList.vUSDCContractAddress);

    //   if (allowance < amount) {
    //     await USDCContract.approve(addressList.vUSDCContractAddress, parseUnits(amount, 6));
    //     await sleep(3000);
    //   }

    //   await vUSDCtokenContract.deposit(parseUnits(amount, 6), account, { gasLimit: 23000000 });
    // } else if (token === "USDT") {
    //   // to confirm this abi, address & function

    //   const allowance = await USDTContract.allowance(account, addressList.vUSDTContractAddress);

    //   if (allowance < amount) {
    //     await USDTContract.approve(addressList.vUSDTContractAddress, parseUnits(amount, 6));
    //     await sleep(3000);
    //   }

    //   await vUSDTtokenContract.deposit(parseUnits(amount, 6), account, { gasLimit: 23000000 });
    // } else {
    //   const allowance = await DAIContract.allowance(account, addressList.vDaiContractAddress);

    //   if (allowance < amount) {
    //     await DAIContract.approve(addressList.vDaiContractAddress, parseEther(amount));
    //     await sleep(3000);
    //   }

    //   await vDAItokenContract.deposit(parseEther(amount), account);
    // }
    // WITHDRAW
    // if(withAccount){
      // if (token === "WETH") {
      //   const vEthcontract = new Contract(addressList.vEtherContractAddress, VEther.abi, signer);
      //   if (amount <= (await vEthcontract.balanceOf(account))) {
      //     await vEthcontract.redeemEth(parseEther(amount), { gasLimit: 2300000 });
      //   }
      // } else if (token === "WBTC") {
      //   const vBTCcontract = new Contract(addressList.vBtcContractAddress, VToken.abi, signer);
      //   if (amount <= (await vBTCcontract.balanceOf(account))) {
      //     await vBTCcontract.redeem(parseEther(amount), account, account, { gasLimit: 2300000 });
      //   }
      // } else if (token === "USDC") {
      //   const vUSDCcontract = new Contract(addressList.vUSDCContractAddress, VToken.abi, signer);
      //   if (amount <= (await vUSDCcontract.balanceOf(account))) {
      //     await vUSDCcontract.redeem(parseUnits(amount, 6), account, account, {
      //       gasLimit: 2300000,
      //     });
      //   }
      // } else if (token === "USDT") {
      //   const vUSDTcontract = new Contract(addressList.vUSDTContractAddress, VToken.abi, signer);
      //   if (amount <= (await vUSDTcontract.balanceOf(account))) {
      //     await vUSDTcontract.redeem(parseUnits(amount, 6), account, account, {
      //       gasLimit: 2300000,
      //     });
      //   }
      // } else if (token === "DAI") {
      //   const vDaicontract = new Contract(addressList.vDaiContractAddress, VToken.abi, signer);
      //   if (amount <= (await vDaicontract.balanceOf(account))) {
      //     await vDaicontract.redeem(parseEther(amount), account, account, { gasLimit: 2300000 });
      //   }
      // } else {
      //   console.error("something went wrong, Please try again.");
      // }
    // }

  const handleToggle = () => setIsSupply(!isSupply);

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setDepositAmount((parseFloat(balance) * (percentage / 100)).toFixed(3));
  };

  const handleNetworkSelect = (network: NetworkOption) => {
    console.log("Selected network:", network);
  };

  return (
    <div className="bg-baseComplementary p-4 rounded-3xl w-full text-baseBlack">
      <div className="flex mb-4 p-1 text-lg">
        <div
          className={clsx(
            "flex-1 p-[1px] rounded-2xl",
            isSupply ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
          )}
        >
          <button
            className={clsx(
              "w-full py-3 px-2 rounded-2xl",
              isSupply ? "bg-white" : "bg-transparent"
            )}
            onClick={handleToggle}
          >
            Supply
          </button>
        </div>
        <div
          className={clsx(
            "flex-1 p-[1px] rounded-2xl",
            !isSupply ? "bg-gradient-to-r from-gradient-1 to-gradient-2" : ""
          )}
        >
          <button
            className={clsx(
              "w-full py-3 px-2 rounded-2xl",
              !isSupply ? "bg-white" : "bg-transparent"
            )}
            onClick={handleToggle}
          >
            Withdraw
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex justify-between mb-2">
          <div className="flex flex-col">
            <span className="font-medium text-sm mb-2">Deposit</span>
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
          </div>
          <div className="flex">
            <NetworkDropdown
              options={networkOptions}
              onSelect={handleNetworkSelect}
              displayName={true}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <div className="text-xs text-neutral-500">Expected 400 USDT</div>
          <div className="text-xs text-neutral-500">Balance: {balance} ETH</div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        {[1, 10, 50, 100].map((percent) => (
          <button
            key={percent}
            onClick={() => handlePercentageClick(percent)}
            className={clsx(
              "w-1/5 h-12 bg-purpleBG-lighter font-semibold text-base rounded-lg"
            )}
          >
            {percent}%
          </button>
        ))}
      </div>

      <div className="p-4 mb-4 text-sm font-medium">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <span className="mr-1">Target token</span>
            <Tooltip content={"Target token"}>
              <Info size={14} color="black" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <Image
              src="/eth-icon.svg"
              alt="swETH logo"
              className="w-6 h-6 mr-1 rounded-full"
              width={16}
              height={16}
            />
            <span className="font-semibold">swETH/v3</span>
          </div>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>You get</span>
          <span>N/A</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span>ETH per swETH/v3</span>
          <span>N/A</span>
        </div>
        {isSupply && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Current APY</span>
              <span>{currentAPY}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Points</span>
              <span>0.00 Kpts MIle per hour</span>
            </div>
          </>
        )}
        {!isSupply && (
          <>
            <div className="flex justify-between text-sm mb-1">
              <span>Available liquidity</span>
              <span>N/A</span>
            </div>
          </>
        )}
      </div>

      <button className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl">
        Deposit
      </button>
    </div>
  );
};

export default SupplyWithdraw;
