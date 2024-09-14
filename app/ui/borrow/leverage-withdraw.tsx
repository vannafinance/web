"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { CaretDown, Info } from "@phosphor-icons/react";
import clsx from "clsx";
import Tooltip from "../components/tooltip";
import Image from "next/image";
import Slider from "./slider";
import TokenDropdown from "../components/token-dropdown";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
import { useNetwork } from "@/app/context/network-context";
import { arbAddressList, arbTokensAddress } from "@/app/lib/web3-constants";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import DefaultRateModel from "../../abi/vanna/v1/out/DefaultRateModel.sol/DefaultRateModel.json";
import RiskEngine from "../../abi/vanna/v1/out/RiskEngine.sol/RiskEngine.json";
import VEther from "../../abi/vanna/v1/out/VEther.sol/VEther.json";
import VToken from "../../abi/vanna/v1/out/VToken.sol/VToken.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import { parseEther, parseUnits } from "ethers/lib/utils";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  sleep,
} from "@/app/lib/helper";

const LevrageWithdraw = () => {
  const { account, library } = useWeb3React();
  const { currentNetwork } = useNetwork();

  const [isSupply, setIsSupply] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );
  const [leverageValue, setLeverageValue] = useState<number>(5);
  // const [coinBalance, setCoinBalance] = useState(0);
  const [depositBalance, setDepositBalance] = useState<string | undefined>();
  const [borrowBalance, setBorrowBalance] = useState<string | undefined>();
  const [debt, setDebt] = useState(0);
  const [healthFactor, setHealthFactor] = useState("-");
  const [activeAccount, setActiveAccount] = useState();

  const [depositToken, setDepositToken] = useState<string>();
  const [borrowToken, setBorrowToken] = useState<string>();

  const balance: string = "1";
  const currentAPY: string = "1";

  const handleToggle = () => setIsSupply(!isSupply);

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setDepositAmount((parseFloat(balance) * (percentage / 100)).toFixed(3));
  };

  const handleDepositTokenSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
    setDepositToken(token.name);
  };

  const handleBorrowTokenSelect = (token: PoolTable) => {
    console.log("Selected token:", token);
    setBorrowToken(token.name);
  };

  const regitstryContract = new Contract(
    arbAddressList.registryContractAddress,
    Registry.abi,
    library
  );

  const accountManagerContract = new Contract(
    arbAddressList.accountManagerContractAddress,
    AccountManager.abi,
    library
  );

  const getTokenBalance = async (tokenName = depositToken) => {
    try {
      if (activeAccount) {
        const signer = await library?.getSigner();
        let depositBalance;
        let borrowBalance;

        if (tokenName == "WETH") {
          depositBalance = await library?.getBalance(account);
          borrowBalance = await library?.getBalance(activeAccount);
        } else {
          if (tokenName === undefined) return;
          const contract = new Contract(
            arbTokensAddress[tokenName],
            ERC20.abi,
            signer
          );
          depositBalance = await contract.balanceOf(account);
          borrowBalance = await contract.balanceOf(activeAccount);
        }

        const depositBalanceInNumber = formatBignumberToUnits(
          tokenName,
          depositBalance
        );
        const borrowBalanceInNumber = formatBignumberToUnits(
          tokenName,
          borrowBalance
        );
        setDepositBalance(ceilWithPrecision(String(depositBalanceInNumber)));
        setBorrowBalance(ceilWithPrecision(String(borrowBalanceInNumber)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deposit = async () => {
    const signer = await library?.getSigner();

    if (depositToken === undefined) return;
    else if (depositToken === "WETH") {
      // await accountManagerContract.depositEth({ value: parseEther(depositAmount) });
      await accountManagerContract.depositEth(activeAccount, {
        value: parseEther(depositAmount),
        gasLimit: 2300000,
      });
    } else if (depositToken === "USDC" || depositToken === "USDT") {
      const erc20Contract = new Contract(
        arbTokensAddress[depositToken],
        ERC20.abi,
        signer
      );
      // need to add check that is already have allowance or not
      const allowance = await erc20Contract.allowance(
        account,
        arbAddressList.accountManagerContractAddress
      );
      if (allowance < depositAmount) {
        await erc20Contract.approve(
          arbAddressList.accountManagerContractAddress,
          parseUnits(depositAmount, 6),
          { gasLimit: 2300000 }
        );
        await sleep(3000);
      }

      await accountManagerContract.deposit(
        activeAccount,
        arbTokensAddress[depositToken],
        parseUnits(depositAmount, 6),
        { gasLimit: 2300000 }
      );
    } else {
      const erc20Contract = new Contract(
        arbTokensAddress[depositToken],
        ERC20.abi,
        signer
      );
      const allowance = await erc20Contract.allowance(
        account,
        arbAddressList.accountManagerContractAddress
      );

      if (allowance < depositAmount) {
        await erc20Contract.approve(
          arbAddressList.accountManagerContractAddress,
          parseEther(depositAmount),
          { gasLimit: 2300000 }
        );
        await sleep(3000);
      }

      await accountManagerContract.deposit(
        activeAccount,
        arbTokensAddress[depositToken],
        parseEther(depositAmount),
        { gasLimit: 2300000 }
      );
    }
  };

  const withdraw = async () => {
    if (depositToken === undefined) return;
    else if (depositToken === "WETH") {
      await accountManagerContract.withdrawEth(
        activeAccount,
        parseEther(depositAmount),
        {
          gasLimit: 2300000,
        }
      );
    } else if (depositToken === "USDC" || depositToken === "USDT") {
      await accountManagerContract.withdraw(
        activeAccount,
        arbTokensAddress[depositToken],
        parseUnits(depositAmount, 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.withdraw(
        activeAccount,
        arbTokensAddress[depositToken],
        parseEther(depositAmount),
        { gasLimit: 2300000 }
      );
    }
  };

  const borrow = async () => {
    if (borrowToken === undefined) return;
    else if (borrowToken === "USDC" || borrowToken === "USDT") {
      await accountManagerContract.borrow(
        activeAccount,
        arbTokensAddress[borrowToken],
        parseUnits(borrowAmount, 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.borrow(
        activeAccount,
        arbTokensAddress[borrowToken],
        parseEther(borrowAmount),
        { gasLimit: 2300000 }
      );
    }
  };

  const repay = async () => {
    if (borrowToken === undefined) return;
    else if (borrowToken === "USDC" || borrowToken === "USDT") {
      await accountManagerContract.repay(
        activeAccount,
        arbTokensAddress[borrowToken],
        parseUnits(borrowAmount, 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.repay(
        activeAccount,
        arbTokensAddress[borrowToken],
        parseEther(borrowAmount),
        { gasLimit: 2300000 }
      );
    }
  };

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
              <TokenDropdown onSelect={handleDepositTokenSelect} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-neutral-500">{depositBalance}</div>
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
              <TokenDropdown onSelect={handleBorrowTokenSelect} />
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

        <button
          className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl"
          onClick={deposit}
        >
          Enter an amount
        </button>
      </div>
    </div>
  );
};

export default LevrageWithdraw;
