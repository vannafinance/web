"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { CaretDown, Info } from "@phosphor-icons/react";
import clsx from "clsx";
import Tooltip from "../components/tooltip";
import Image from "next/image";
import Slider from "./slider";
import TokenDropdown from "../components/token-dropdown";

const LevrageWithdraw = () => {
  const [isSupply, setIsSupply] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );
  const [leverageValue, setLeverageValue] = useState<number>(5);
  const [coinBalance, setCoinBalance] = useState(0);
  const [debt, setDebt] = useState(0);
  const [healthFactor, setHealthFactor] = useState("-");


  const balance: string = "1";
  const currentAPY: string = "1";

  const handleToggle = () => setIsSupply(!isSupply);

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setDepositAmount((parseFloat(balance) * (percentage / 100)).toFixed(3));
  };

  const handleTokenSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
  };

  const leverage = async() => {
    
  }


    // const regitstryContract = new Contract(
    //   addressList.registryContractAddress,
    //   Registry.abi,
    //   signer
    // );

    // const accountManagerContract = new Contract(
    //   addressList.accountManagerContractAddress,
    //   AccountManager.abi,
    //   signer
    // );

    // Deposit Main code 
    // if (tabValue === 0) {
    //   if (token === "WETH") {
    //     // await accountManagerContract.depositEth({ value: parseEther(amount) });
    //     await accountManagerContract.depositEth(activeAccount, {
    //       value: parseEther(amount),
    //       gasLimit: 2300000,
    //     });
    //   } else if (token === "USDC" || token === "USDT") {
    //     const erc20Contract = new Contract(tokensAddress[token], ERC20.abi, signer);
    //     // need to add checksum that is already have allowance or not
    //     const allowance = await erc20Contract.allowance(
    //       account,
    //       addressList.accountManagerContractAddress
    //     );
    //     if (allowance < amount) {
    //       await erc20Contract.approve(
    //         addressList.accountManagerContractAddress,
    //         parseUnits(amount, 6),
    //         { gasLimit: 2300000 }
    //       );
    //       await sleep(3000);
    //     }

    //     await accountManagerContract.deposit(
    //       activeAccount,
    //       tokensAddress[token],
    //       parseUnits(amount, 6),
    //       { gasLimit: 2300000 }
    //     );
    //   } else {
    //     const erc20Contract = new Contract(tokensAddress[token], ERC20.abi, signer);
    //     const allowance = await erc20Contract.allowance(
    //       account,
    //       addressList.accountManagerContractAddress
    //     );

    //     if (allowance < amount) {
    //       await erc20Contract.approve(
    //         addressList.accountManagerContractAddress,
    //         parseEther(amount),
    //         { gasLimit: 2300000 }
    //       );
    //       await sleep(3000);
    //     }

    //     await accountManagerContract.deposit(
    //       activeAccount,
    //       tokensAddress[token],
    //       parseEther(amount),
    //       { gasLimit: 2300000 }
    //     );
    //   }
    // } 

    // WithDraw Main code 
    // else {
    //   if (token === "WETH") {
    //     await accountManagerContract.withdrawEth(activeAccount, parseEther(amount), {
    //       gasLimit: 2300000,
    //     });
    //   } else if (token === "USDC" || token === "USDT") {
    //     await accountManagerContract.withdraw(
    //       activeAccount,
    //       tokensAddress[token],
    //       parseUnits(amount, 6),
    //       { gasLimit: 2300000 }
    //     );
    //   } else {
    //     await accountManagerContract.withdraw(
    //       activeAccount,
    //       tokensAddress[token],
    //       parseEther(amount),
    //       { gasLimit: 2300000 }
    //     );
    //   }
    // }

    // const accountsArray = await regitstryContract.accountsOwnedBy(account);
  
    //metamask balance => account is EOA account
    // const getTokenBalance = async (tokenName = token) => {
    //   try {
    //     if (activeAccount) {
    //       const signer = await library?.getSigner();
    //       let bal;
  
    //       if (tokenName == "WETH") {
    //         if (tabValue === 0) {
    //           bal = await library?.getBalance(account);
    //         } else {
    //           bal = await library?.getBalance(activeAccount);
    //         }
    //       } else {
    //         const contract = new Contract(tokensAddress[tokenName], ERC20.abi, signer);
    //         if (tabValue === 0) {
    //           bal = await contract.balanceOf(account);
    //         } else {
    //           bal = await contract.balanceOf(activeAccount);
    //         }
    //       }
  
    //       const balInNumber = formatBignumberToUnits(tokenName, bal);
    //       setCoinBalance(ceilWithPrecision(balInNumber));
    //     }
    //   } catch (e) {
    //     console.error(e);
    //   }
    // };

  // }

  return (
    <div className="bg-baseComplementary p-2 rounded-3xl w-full text-baseBlack">
      <div className="flex mb-8 text-lg">
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
            Leverage your Assets
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
            Withdraw your Assets
          </button>
        </div>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl p-4 mb-3">
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
              <TokenDropdown
                onSelect={handleTokenSelect}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-neutral-500">{coinBalance}</div>
          </div>
        </div>

        <div className="flex justify-between mb-10">
          {[1, 10, 50, 100].map((percent) => (
            <button
              key={percent}
              onClick={() => handlePercentageClick(percent)}
              className={clsx(
                "w-1/5 h-12 bg-lightBlueBG font-semibold text-base rounded-lg"
              )}
            >
              {percent}%
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-4 mb-10">
          <div className="flex justify-between mb-2">
            <div className="flex flex-col">
              <span className="font-medium text-sm mb-2">Borrow</span>
              <input
                type="number"
                value={borrowAmount}
                onChange={(e) => setBorrowAmount(e.target.value)}
                className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0"
              />
            </div>
            <div className="flex">
              <TokenDropdown
                onSelect={handleTokenSelect}
              />
            </div>
          </div>
          <div className="flex justify-end items-center mt-2">
            <div className="text-xs text-neutral-500 mr-2">Debt: {debt}</div>
            <button className="py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite">
              Max
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center mb-14">
          <Slider value={leverageValue} onChange={setLeverageValue} />
        </div>

        <div className="flex justify-between items-center text-xl mb-8">
          <div className="flex items-center">
            <span className="mr-1">Health Factor</span>
            <span className="text-baseSuccess-300">
              &nbsp;<u>{healthFactor}</u>&nbsp;
            </span>
            <Tooltip content={"Target token"}>
              <Info size={24} color="#2ea88e" />
            </Tooltip>
          </div>
          <div className="flex items-center">
            <span className="font-semibold">LTV &nbsp;70.00%</span>&nbsp;&nbsp;
            <span className="text-xs text-neutral-500 mr-2 self-end">
              from 96%
            </span>
          </div>
        </div>

        <button className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl" onClick={leverage}>
          Enter an amount
        </button>
      </div>
    </div>
  );
};

export default LevrageWithdraw;
