import React, { useState } from "react";
import { CaretDown, Info } from "@phosphor-icons/react";
import clsx from "clsx";
import { networkOptions } from "@/app/lib/constants";
import NetworkDropdown from "../header/network-dropdown";
import Tooltip from "../components/tooltip";
import Image from "next/image";
import Slider from "./slider";

const LevrageWithdraw = () => {
  const [isSupply, setIsSupply] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );
  const [leverageValue, setLeverageValue] = useState<number>(5);

  const balance: string = "1";
  const currentAPY: string = "1";

  const handleToggle = () => setIsSupply(!isSupply);

  const handlePercentageClick = (percentage: number) => {
    setSelectedPercentage(percentage);
    setDepositAmount((parseFloat(balance) * (percentage / 100)).toFixed(3));
  };

  const handleNetworkSelect = (network: NetworkOption) => {
    console.log("Selected network:", network);
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
              <NetworkDropdown
                options={networkOptions}
                onSelect={handleNetworkSelect}
                displayName={true}
              />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xs text-neutral-500">$30.12</div>
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
              <NetworkDropdown
                options={networkOptions}
                onSelect={handleNetworkSelect}
                displayName={true}
              />
            </div>
          </div>
          <div className="flex justify-end items-center mt-2">
            <div className="text-xs text-neutral-500 mr-2">Debt: 9400</div>
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
              &nbsp;<u>2.1</u>&nbsp;
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

        <button className="w-full bg-purple text-white py-3 rounded-2xl font-semibold text-xl">
          Enter an amount
        </button>
      </div>
    </div>
  );
};

export default LevrageWithdraw;
