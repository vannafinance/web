import React, { useState } from "react";
import { CaretDown, Info } from "@phosphor-icons/react";
import clsx from "clsx";
import { networkOptions } from "@/app/lib/constants";
import NetworkDropdown from "../header/network-dropdown";
import Tooltip from "../components/tooltip";
import Image from "next/image";

const SupplyWithdraw: React.FC<DepositInterfaceProps> = ({
  balance,
  currentAPY,
}) => {
  const [isSupply, setIsSupply] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(
    null
  );

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
              // selectedPercentage === percent
              //   ? "bg-purple-100 text-purple-700"
              //   : "bg-gray-200 text-gray-700"
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
