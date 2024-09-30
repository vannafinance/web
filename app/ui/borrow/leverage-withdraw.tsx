"use client";

/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from "react";
import { Question } from "@phosphor-icons/react";
import clsx from "clsx";
import Tooltip from "../components/tooltip";
import Slider from "./slider";
import TokenDropdown from "../components/token-dropdown";
import { Contract } from "ethers";
import { useWeb3React } from "@web3-react/core";
// import { useNetwork } from "@/app/context/network-context";
import {
  arbAddressList,
  arbTokensAddress,
  baseTokensAddress,
} from "@/app/lib/web3-constants";

import AccountManager from "../../abi/vanna/v1/out/AccountManager.sol/AccountManager.json";
import Registry from "../../abi/vanna/v1/out/Registry.sol/Registry.json";
import ERC20 from "../../abi/vanna/v1/out/ERC20.sol/ERC20.json";
import { parseEther, parseUnits } from "ethers/lib/utils";
import {
  ceilWithPrecision,
  formatBignumberToUnits,
  sleep,
} from "@/app/lib/helper";
import AccountOverview from "./account-overview";
import CreateSmartAccountModal from "./create-smart-account-model";
import Loader from "../components/loader";

const LevrageWithdraw = () => {
  const { account, library } = useWeb3React();
  // const { currentNetwork } = useNetwork();

  const [loading, setLoading] = useState(false);
  const [disableBtn, setDisableBtn] = useState(true);
  const [btnValue, setBtnValue] = useState("Enter an amount");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLeverage, setIsLeverage] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number | undefined>();
  const [borrowAmount, setBorrowAmount] = useState<number | undefined>();
  // const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
  //   null
  // );
  const [leverageValue, setLeverageValue] = useState<number>(5);
  const [leverageAmount, setLeverageAmount] = useState<number | undefined>();
  const [depositBalance, setDepositBalance] = useState<string | undefined>("-");
  // const [borrowBalance, setBorrowBalance] = useState<string | undefined>("-");
  const [debt, setDebt] = useState(0);
  const [healthFactor, setHealthFactor] = useState("-");
  const [activeAccount, setActiveAccount] = useState<string | undefined>();

  const [depositToken, setDepositToken] = useState<PoolTable>();
  const [borrowToken, setBorrowToken] = useState<PoolTable>();

  const balance: string = "1";
  const currentAPY: string = "1";

  const handleToggle = (value: string) => {
    if (
      (value === "withdraw" && isLeverage) ||
      (value === "leverage" && !isLeverage)
    ) {
      setIsLeverage(!isLeverage);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (depositAmount) {
      setDepositAmount(Number(((depositAmount * percentage) / 100).toFixed(3)));
    }
  };

  const handleDepositTokenSelect = (token: PoolTable) => {
    setDepositToken(token);
  };

  const handleBorrowTokenSelect = (token: PoolTable) => {
    setBorrowToken(token);
  };

  const handleMaxClick = () => {
    setDepositAmount(debt);
  };

  useEffect(() => {
    const tokenName = depositToken ? depositToken.name : "";
    if (depositAmount === undefined || depositAmount <= 0) {
      setBtnValue("Enter an amount");
      setDisableBtn(true);
    } else if (
      depositBalance &&
      depositAmount &&
      Number(depositBalance) * 1.0 < depositAmount * 1.0
    ) {
      setBtnValue("Insufficient " + tokenName + " balance");
      setDisableBtn(true);
    } else {
      setBtnValue(
        isLeverage
          ? borrowAmount && borrowAmount > 0
            ? tokenName === "WETH"
              ? "Deposit & Borrow"
              : "Approve - Deposit & Borrow"
            : tokenName === "WETH"
            ? "Deposit"
            : "Approve - Deposit"
          : borrowAmount && borrowAmount > 0
          ? tokenName === "WETH"
            ? "Repay & Withdraw"
            : "Approve - Repay & Withdraw"
          : tokenName === "WETH"
          ? "Repay"
          : "Approve - Repay"
      );
      setDisableBtn(false);
    }
  }, [depositAmount, depositBalance, isLeverage, borrowAmount, depositToken]);

  const accountCheck = async () => {
    if (localStorage?.getItem("isWalletConnected") === "true") {
      if (account) {
        try {
          const signer = await library?.getSigner();

          const regitstryContract = new Contract(
            arbAddressList.registryContractAddress,
            Registry.abi,
            signer
          );

          const accountsArray = await regitstryContract.accountsOwnedBy(
            account
          );
          let tempAccount;

          if (accountsArray.length > 0) {
            tempAccount = accountsArray[0];
            setActiveAccount(tempAccount);
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setActiveAccount(undefined);
      }
    }
    setLoading(false);
  };

  const getTokenBalance = async (token = depositToken) => {
    try {
      if (account) {
        const signer = await library?.getSigner();
        let depositBalance;
        let borrowBalance;

        if (token?.name == "WETH") {
          depositBalance = await library?.getBalance(account);
          if (activeAccount) {
            borrowBalance = await library?.getBalance(activeAccount);
          }
        } else {
          if (token?.name === undefined) return;
          const contract = new Contract(
            baseTokensAddress[token?.name],
            ERC20.abi,
            signer
          );
          depositBalance = await contract.balanceOf(account);
          if (activeAccount) {
            borrowBalance = await contract.balanceOf(activeAccount);
          }
        }

        const depositBalanceInNumber = formatBignumberToUnits(
          token?.name,
          depositBalance
        );
        // const borrowBalanceInNumber = formatBignumberToUnits(
        //   token?.name,
        //   borrowBalance
        // );
        setDepositBalance(ceilWithPrecision(String(depositBalanceInNumber)));
        // setBorrowBalance(ceilWithPrecision(String(borrowBalanceInNumber)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    accountCheck();
  }, []);

  useEffect(() => {
    accountCheck();
  }, [isModalOpen]);

  useEffect(() => {
    accountCheck();
    getTokenBalance();
  }, [account, activeAccount]);

  useEffect(() => {
    if (borrowAmount && borrowAmount > 0) {
      setLeverageAmount(borrowAmount * leverageValue);
    }
  }, [leverageValue, borrowAmount]);

  const process = async () => {
    if (isLeverage) {
      deposit();
      if (borrowAmount && borrowAmount > 0) {
        borrow();
      }
    } else {
      repay();
      if (borrowAmount && borrowAmount > 0) {
        withdraw();
      }
    }
  };

  const deposit = async () => {
    const signer = await library?.getSigner();
    const accountManagerContract = new Contract(
      arbAddressList.accountManagerContractAddress,
      AccountManager.abi,
      signer
    );

    if (
      depositToken === undefined ||
      depositAmount === undefined ||
      !activeAccount
    )
      return;
    else if (depositToken?.name === "WETH") {
      // await accountManagerContract.depositEth({ value: parseEther(depositAmount) });
      await accountManagerContract.depositEth(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        {
          value: parseEther(String(depositAmount)),
          gasLimit: 2300000,
        }
      );
    } else if (depositToken?.name === "USDC" || depositToken?.name === "USDT") {
      const erc20Contract = new Contract(
        arbTokensAddress[depositToken?.name],
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
          parseUnits(String(depositAmount), 6),
          { gasLimit: 2300000 }
        );
        await sleep(3000);
      }

      await accountManagerContract.deposit(
        activeAccount,
        arbTokensAddress[depositToken?.name],
        parseUnits(String(depositAmount), 6),
        { gasLimit: 2300000 }
      );
    } else {
      const erc20Contract = new Contract(
        arbTokensAddress[depositToken?.name],
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
          parseEther(String(depositAmount)),
          { gasLimit: 2300000 }
        );
        await sleep(3000);
      }

      await accountManagerContract.deposit(
        activeAccount,
        arbTokensAddress[depositToken?.name],
        parseEther(String(depositAmount)),
        { gasLimit: 2300000 }
      );
    }
  };

  const withdraw = async () => {
    const signer = await library?.getSigner();
    const accountManagerContract = new Contract(
      arbAddressList.accountManagerContractAddress,
      AccountManager.abi,
      signer
    );

    if (depositToken?.name === undefined) return;
    else if (depositToken?.name === "WETH") {
      await accountManagerContract.withdrawEth(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        parseEther(String(depositAmount)),
        {
          gasLimit: 2300000,
        }
      );
    } else if (depositToken?.name === "USDC" || depositToken?.name === "USDT") {
      await accountManagerContract.withdraw(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[depositToken?.name],
        parseUnits(String(depositAmount), 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.withdraw(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[depositToken?.name],
        parseEther(String(depositAmount)),
        { gasLimit: 2300000 }
      );
    }
  };

  const borrow = async () => {
    const signer = await library?.getSigner();
    const accountManagerContract = new Contract(
      arbAddressList.accountManagerContractAddress,
      AccountManager.abi,
      signer
    );
    if (borrowToken === undefined) return;
    else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
      await accountManagerContract.borrow(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[borrowToken?.name],
        parseUnits(String(borrowAmount), 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.borrow(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[borrowToken?.name],
        parseEther(String(borrowAmount)),
        { gasLimit: 2300000 }
      );
    }
  };

  const repay = async () => {
    const signer = await library?.getSigner();
    const accountManagerContract = new Contract(
      arbAddressList.accountManagerContractAddress,
      AccountManager.abi,
      signer
    );

    if (borrowToken === undefined) return;
    else if (borrowToken?.name === "USDC" || borrowToken?.name === "USDT") {
      await accountManagerContract.repay(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[borrowToken?.name],
        parseUnits(String(borrowAmount), 6),
        { gasLimit: 2300000 }
      );
    } else {
      await accountManagerContract.repay(
        "0xe93dDe42d9A17636B62b894B9911baa1Bdb1fD2e",
        arbTokensAddress[borrowToken?.name],
        parseEther(String(borrowAmount)),
        { gasLimit: 2300000 }
      );
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-10 text-base">
      <div className="bg-white w-full mx-auto mb-6">
        <div className="bg-baseComplementary p-2 rounded-3xl w-full text-baseBlack">
          <div className="flex mb-8 text-lg">
            <div
              className={clsx(
                "flex-1 p-[1px] rounded-2xl",
                isLeverage
                  ? "bg-gradient-to-r from-gradient-1 to-gradient-2"
                  : ""
              )}
            >
              <button
                className={clsx(
                  "w-full py-3 px-2 rounded-2xl",
                  isLeverage ? "bg-white" : "bg-transparent"
                )}
                onClick={() => handleToggle("leverage")}
              >
                Leverage your Assets
              </button>
            </div>
            <div
              className={clsx(
                "flex-1 p-[1px] rounded-2xl",
                !isLeverage
                  ? "bg-gradient-to-r from-gradient-1 to-gradient-2"
                  : ""
              )}
            >
              <button
                className={clsx(
                  "w-full py-3 px-2 rounded-2xl",
                  !isLeverage ? "bg-white" : "bg-transparent"
                )}
                onClick={() => handleToggle("withdraw")}
              >
                Withdraw your Assets
              </button>
            </div>
          </div>

          <div className="px-4">
            <div className="bg-white rounded-2xl p-4 mb-3">
              <div className="flex justify-between mb-2">
                <div className="flex flex-col">
                  <span className="font-medium text-sm mb-2">
                    {isLeverage ? "Deposit" : "Repay"}
                  </span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
                <div className="flex">
                  <TokenDropdown onSelect={handleDepositTokenSelect} />
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <div className="text-xs text-neutral-500">
                  Balance: {depositBalance}{" "}
                  {depositBalance !== "-" ? depositToken?.name : ""}
                </div>
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
                  <span className="font-medium text-sm mb-2">
                    {isLeverage ? "Borrow" : "Withdraw"}
                  </span>
                  <input
                    type="number"
                    value={borrowAmount}
                    onChange={(e) => setBorrowAmount(Number(e.target.value))}
                    className="w-full text-baseBlack text-2xl font-bold outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                </div>
                <div className="flex">
                  <TokenDropdown onSelect={handleBorrowTokenSelect} />
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="text-xs text-neutral-500">
                  Leverage Value: {leverageAmount ? leverageAmount : "-"}
                </div>
                <div className="flex">
                  <div className="text-xs text-neutral-500 mr-2">
                    Debt: {debt}
                  </div>
                  <button
                    className="py-0.5 px-1 bg-gradient-to-r from-gradient-1 to-gradient-2 text-xs rounded-md text-baseWhite"
                    onClick={handleMaxClick}
                  >
                    Max
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mb-14">
              <Slider value={leverageValue} onChange={setLeverageValue} />
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center text-xl mb-8 gap-2 sm:gap-0">
              <div className="flex items-center">
                <span className="mr-1">Health Factor</span>
                <span className="text-baseSuccess-300">
                  &nbsp;<u>{healthFactor !== "-" ? healthFactor : ""}</u>&nbsp;
                </span>
                <Tooltip content={"Target token"}>
                  <Question size={24} color="#2ea88e" />
                </Tooltip>
              </div>
              <div className="flex items-center">
                <span className="font-semibold">LTV &nbsp;70.00%</span>
                &nbsp;&nbsp;
                <span className="text-xs text-neutral-500 mr-2 self-end">
                  from 96%
                </span>
              </div>
            </div>

            {!account && (
              <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
                Connect Wallet
              </button>
            )}
            {account && loading && (
              <button className="w-full bg-purple py-3 rounded-2xl font-semibold text-xl mb-6 flex justify-center">
                <Loader />
              </button>
            )}
            {account && activeAccount === undefined && !loading && (
              <button
                className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
                onClick={() => setIsModalOpen(true)}
              >
                Create your Smart Account
              </button>
            )}
            {account &&
              activeAccount !== undefined &&
              !loading &&
              disableBtn && (
                <button className="w-full bg-neutral-500 text-white py-3 rounded-2xl font-semibold text-xl mb-6">
                  {btnValue}
                </button>
              )}
            {account &&
              activeAccount !== undefined &&
              !loading &&
              !disableBtn && (
                <button
                  className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl mb-6"
                  onClick={process}
                >
                  {btnValue}
                </button>
              )}
          </div>
        </div>
      </div>
      <div className="flex-none w-full lg:w-2/5 xl:w-1/3 space-y-6 text-baseBlack font-medium">
        <AccountOverview
          creditToken={borrowToken}
          leverage={leverageValue}
          activeAccount={activeAccount}
        />
      </div>

      <CreateSmartAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default LevrageWithdraw;
