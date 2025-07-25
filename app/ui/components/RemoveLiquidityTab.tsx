import React, { useState } from "react";
import Image from "next/image";
import FarmSlider from "../future/farmSlider";

const percentageOptions = [25, 50, 75, 100];

const RemoveLiquidityTab: React.FC<RemoveLiquidityTabProps> = ({
  state,
  onChange,
  onConnectWallet,
  isWalletConnected,
  token0,
  token1,
}) => {
  const handlePercentageChange = (value: number) => {
    onChange({
      ...state,
      percentage: value,
      // Optionally update token amounts here if needed
    });
  };

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-baseDark  rounded-xl">
      <div className="mb-4">
        <div className="font-semibold text-baseBlack dark:text-white text-lg mb-1">
          Remove liquidity
        </div>
        <div className="text-neutral-600 dark:text-neutral-300 text-sm mb-2">
          Please enter how much of the position you want to remove.
        </div>
        <div className="mt-6 mb-2 border border-neutral-400 dark:border-neutral-800 rounded-xl py-4 px-6 ">
          <div className="flex flex-col md:flex-row justify-center items-center md:flex md:justify-between items-center gap-2">
            <div className="mb-3 md:mb-0">
              <span className=" text-xl font-bold">{state.percentage}%</span>
            </div>

            <div className="flex gap-2 mb-4">
              {percentageOptions.map((opt) => (
                <button
                  key={opt}
                  className={`px-3 py-1 rounded-lg  text-sm font-semibold ${
                    state.percentage === opt
                      ? "bg-gradient-to-r from-gradient-1 to-gradient-2 text-white"
                      : "border border-neutral-400 dark:border-neutral-700  text-baseBlack dark:text-white"
                  }`}
                  onClick={() => handlePercentageChange(opt)}
                >
                  {opt === 100 ? "Max" : `${opt}%`}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-2">
            <FarmSlider  onChange={(val) => handlePercentageChange(val)} value={state.percentage} key={"range"}/>
          </div>
        </div>
      </div>
      <div className="py-4 px-6 rounded-xl border border-neutral-400 dark:border-neutral-800 ">
        <div className="mb-6 ">
          <div className="font-semibold text-sm text-neutral-600 mb-2">
            You'll receive
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Image
                src={token0.icon}
                alt={token0.symbol}
                width={20}
                height={20}
              />
              <span className="font-semibold">{token0.symbol}</span>
              <span className="ml-auto font-semibold">
                {state.token0Amount}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Image
                src={token1.icon}
                alt={token1.symbol}
                width={20}
                height={20}
              />
              <span className="font-semibold">{token1.symbol}</span>
              <span className="ml-auto font-semibold">
                {state.token1Amount}
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="mb-4">
            <div className="text-sm text-neutral-600 mb-2">
              You'll receive collected fees
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Image
                  src={token0.icon}
                  alt={token0.symbol}
                  width={20}
                  height={20}
                />
                <span className="font-semibold">{token0.symbol}</span>
                <span className="ml-auto font-semibold">
                  {state.fees.token0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Image
                  src={token1.icon}
                  alt={token1.symbol}
                  width={20}
                  height={20}
                />
                <span className="font-semibold">{token1.symbol}</span>
                <span className="ml-auto font-semibold">
                  {state.fees.token1}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isWalletConnected && (
        <button
          disabled
          className="cursor-not-allowed w-full bg-gray-300 dark:bg-gray-500 text-neutral-400 font-bold py-3 rounded-xl text-lg mt-2"
        >
          Connect Wallet
        </button>
      )}
      {isWalletConnected && (
        <button className="w-full bg-gradient-to-r from-gradient-1 to-gradient-2 text-white font-bold py-3 rounded-xl text-lg mt-2">
          Remove
        </button>
      )}
    </div>
  );
};

export default RemoveLiquidityTab;
